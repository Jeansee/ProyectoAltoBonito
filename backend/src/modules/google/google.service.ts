// backend/src/modules/google/google.service.ts
import axios from 'axios';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { encrypt, decrypt } from './crypto.util';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

@Injectable()
export class GoogleService {
  private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(private prisma: PrismaService) {}

  // ───────── OAuth ─────────
  buildAuthUrl({
    calendar = false,
    state,
    codeChallenge,
  }: { calendar?: boolean; state: string; codeChallenge: string }) {
    const base = 'https://accounts.google.com/o/oauth2/v2/auth';
    const scope = [
      'openid',
      'email',
      'profile',
      ...(calendar ? ['https://www.googleapis.com/auth/calendar.events'] : []),
    ].join(' ');
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      include_granted_scopes: 'true',
      access_type: 'offline',
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      ...(calendar ? { prompt: 'consent' } : {}),
    });
    return `${base}?${params.toString()}`;
  }

  async exchangeCode({ code, codeVerifier }: { code: string; codeVerifier: string }) {
    const { data } = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return data as {
      access_token: string; expires_in: number; refresh_token?: string;
      id_token: string; scope: string; token_type: 'Bearer';
    };
  }

  async verifyIdToken(idToken: string) {
    const res = await this.client.verifyIdToken({
      idToken, audience: process.env.GOOGLE_CLIENT_ID!,
    });
    return res.getPayload();
  }

  async upsertUserFromGoogle(
    payload: any,
    tokens: { access_token: string; expires_in: number; refresh_token?: string },
  ) {
    const sub = payload.sub as string;
    const email = (payload.email as string)?.toLowerCase();
    const name = payload.given_name || payload.name || 'Usuario';
    const familyName = payload.family_name || '';

    let user = await this.prisma.usuario.findFirst({
      where: { OR: [{ googleSub: sub }, { correo: email }] },
    });

    const now = new Date();
    const accessExp = new Date(now.getTime() + tokens.expires_in * 1000);

    if (!user) {
      const rnd = cryptoRandomString(24);
      const hash = await bcrypt.hash(rnd, 10);
      user = await this.prisma.usuario.create({
        data: {
          nombre: name,
          apellido: familyName,
          correo: email,
          telefono: '',
          password: hash,
          googleSub: sub,
          googleEmail: email,
          googleAvatarUrl: payload.picture || null,
          googleAccessToken: tokens.access_token,
          googleAccessExpAt: accessExp,
          ...(tokens.refresh_token ? { googleRefreshCipher: encrypt(tokens.refresh_token) } : {}),
        },
      });
    } else {
      user = await this.prisma.usuario.update({
        where: { id: user.id },
        data: {
          googleSub: user.googleSub ?? sub,
          googleEmail: user.googleEmail ?? email,
          googleAvatarUrl: payload.picture || user.googleAvatarUrl,
          googleAccessToken: tokens.access_token,
          googleAccessExpAt: accessExp,
          ...(tokens.refresh_token ? { googleRefreshCipher: encrypt(tokens.refresh_token) } : {}),
          updatedAt: new Date(),
        },
      });
    }
    return user;
  }

  // ───────── Calendar helpers ─────────
  private oAuthClient() {
    return new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    });
  }

  private getAuthorizedClientForUser(user: { googleRefreshCipher?: string | null }) {
    if (!user.googleRefreshCipher) {
      throw new BadRequestException('El usuario no tiene Google Calendar conectado.');
    }
    const refresh = decrypt(user.googleRefreshCipher);
    const client = this.oAuthClient();
    client.setCredentials({ refresh_token: refresh });
    return client;
  }

  /**
   * YYYY-MM-DD en TZ local (para all-day).
   */
  private formatDateInTZ(d: Date, tz: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const y = parts.find(p => p.type === 'year')!.value;
    const m = parts.find(p => p.type === 'month')!.value;
    const day = parts.find(p => p.type === 'day')!.value;
    return `${y}-${m}-${day}`;
  }

  /**
   * Suma días a un YYYY-MM-DD (end.date es exclusivo).
   */
  private addDaysToDateStr(dayStr: string, days: number): string {
    const [Y, M, D] = dayStr.split('-').map(Number);
    const u = new Date(Date.UTC(Y, M - 1, D));
    u.setUTCDate(u.getUTCDate() + days);
    const yyyy = u.getUTCFullYear();
    const mm = String(u.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(u.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * ⚠️ Clave para POR_HORA/BLOQUE:
   * Construye "YYYY-MM-DDTHH:mm:ss" **sin Z** usando los *campos UTC* del Date,
   * tratándolos como hora “de pared”. Google lo ubicará en `timeZone`.
   */
  private asWallTimeString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day}T${hh}:${mi}:${ss}`;
  }

  private buildSummary(reserva: any, items: any[]): string {
    const recurso = items?.[0]?.recurso?.nombre ?? 'Recurso';
    return `Reserva ${recurso} - ${reserva.modalidad}`;
  }

  private buildDescription(reserva: any, items: any[]): string {
    const lines = [
      `ID: ${reserva.id}`,
      `Modalidad: ${reserva.modalidad}`,
      `Recursos: ${(items || []).map((i: any) => i?.recurso?.nombre || i?.recursoId).join(', ')}`,
    ];
    return lines.join('\n');
  }

  // ───────── Crear / borrar eventos ─────────
  async createEventForUser(user: any, reserva: any, items: any[]) {
    if (!user?.googleRefreshCipher) return null;

    const auth = this.getAuthorizedClientForUser(user);
    const calendar = google.calendar({ version: 'v3', auth });
    const tz = 'America/Santiago';

    if (reserva.modalidad === 'DIA_COMPLETO') {
      // ✅ all-day correcto en TZ local
      const startDayLocal = this.formatDateInTZ(new Date(reserva.inicio), tz);
      const endDayLocal = this.addDaysToDateStr(startDayLocal, 1); // exclusivo

      const resp = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: this.buildSummary(reserva, items),
          description: this.buildDescription(reserva, items),
          start: { date: startDayLocal },
          end:   { date: endDayLocal },
        },
      });
      return resp.data.id || null;
    } else {
      // ✅ POR_HORA / BLOQUE: NO usar toISOString(); usar "hora de pared" + timeZone
      const startLocal = this.asWallTimeString(new Date(reserva.inicio));
      const endLocal   = this.asWallTimeString(new Date(reserva.fin));

      const resp = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: this.buildSummary(reserva, items),
          description: this.buildDescription(reserva, items),
          start: { dateTime: startLocal, timeZone: tz },
          end:   { dateTime: endLocal,   timeZone: tz },
          attendees: [{ email: user.correo, displayName: `${user.nombre} ${user.apellido}` }],
          reminders: { useDefault: true },
        },
      });
      return resp.data.id || null;
    }
  }

  async deleteEventForUser(user: any, gcalEventId: string) {
    if (!user?.googleRefreshCipher || !gcalEventId) return;
    const auth = this.getAuthorizedClientForUser(user);
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({ calendarId: 'primary', eventId: gcalEventId });
  }

  async createEvent(params: {
    userId: string; summary: string; description?: string;
    start: Date; end: Date; timeZone?: string;
  }) {
    const user = await this.prisma.usuario.findUnique({ where: { id: params.userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (!user.googleRefreshCipher) {
      throw new BadRequestException('El usuario no tiene autorizado Google Calendar.');
    }

    const auth = this.getAuthorizedClientForUser(user);
    const calendar = google.calendar({ version: 'v3', auth });
    const tz = params.timeZone || 'America/Santiago';

    // ✅ también aquí: hora de pared + TZ
    const startLocal = this.asWallTimeString(params.start);
    const endLocal   = this.asWallTimeString(params.end);

    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: startLocal, timeZone: tz },
        end:   { dateTime: endLocal,   timeZone: tz },
      },
    });

    return { id: data.id as string, htmlLink: data.htmlLink as string | undefined };
  }

  // ───────── Revocar / Estado ─────────
  async revokeAndClear(userId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    try {
      const refresh = user.googleRefreshCipher ? decrypt(user.googleRefreshCipher) : null;
      if (refresh) {
        await axios.post(
          'https://oauth2.googleapis.com/revoke',
          new URLSearchParams({ token: refresh }).toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
      }
    } catch {}

    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        googleSub: null,
        googleEmail: null,
        googleAvatarUrl: null,
        googleRefreshCipher: null,
        googleAccessToken: null,
        googleAccessExpAt: null,
      },
    });

    return { ok: true };
  }

  async getConnectionStatus(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { googleRefreshCipher: true, googleEmail: true },
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    return { connected: !!user.googleRefreshCipher, email: user.googleEmail ?? null };
  }
}

function cryptoRandomString(len = 24) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('crypto');
  return randomBytes(len).toString('base64url');
}
