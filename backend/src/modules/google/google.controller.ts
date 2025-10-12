// backend/src/modules/google/google.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  BadRequestException,
  Req,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { GoogleService } from './google.service';
import { genCodeVerifier, codeChallengeFromVerifier, genState } from './pkce.util';
import { AuthService } from '../auth/auth.service';

const CV_COOKIE = 'g_cv';
const ST_COOKIE = 'g_st';
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, secure: false, path: '/' };

/**
 * Devuelve un redirect_uri que matchea el host de la petición.
 * - Si vienes por el proxy (5173), usa http://localhost:5173/api/auth/google/callback
 * - Si vienes directo al backend (3000), usa http://localhost:3000/api/auth/google/callback
 * - Como fallback, usa el GOOGLE_REDIRECT_URI del .env
 */
function computeRedirectUri(req: Request): string {
  const host =
    (req.headers['x-forwarded-host'] as string) ||
    (req.headers['host'] as string) ||
    '';
  const proto =
    (req.headers['x-forwarded-proto'] as string) ||
    (req.protocol || 'http');

  const is5173 = host.includes('localhost:5173');
  const is3000 = host.includes('localhost:3000');

  if (is5173) {
    return `${proto}://localhost:5173/api/auth/google/callback`;
  }
  if (is3000) {
    return `${proto}://localhost:3000/api/auth/google/callback`;
  }

  // Fallback a env o al host actual
  return process.env.GOOGLE_REDIRECT_URI || `${proto}://${host}/api/auth/google/callback`;
}

/** Construye la URL de autorización de Google con redirect_uri dinámico */
function buildAuthUrlInline(opts: {
  clientId: string;
  redirectUri: string;
  calendar: boolean;
  state: string;
  codeChallenge: string;
}) {
  const base = 'https://accounts.google.com/o/oauth2/v2/auth';
  const scope = [
    'openid',
    'email',
    'profile',
    ...(opts.calendar ? ['https://www.googleapis.com/auth/calendar.events'] : []),
  ].join(' ');

  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    include_granted_scopes: 'true',
    access_type: 'offline',
    scope,
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
    ...(opts.calendar ? { prompt: 'consent' } : {}),
  });

  return `${base}?${params.toString()}`;
}

@Controller('auth/google')
export class GoogleController {
  constructor(private google: GoogleService, private auth: AuthService) {}

  // 1) Inicio de OAuth (sin Calendar) — devuelve HTML que hace location.replace(...)
  @Get('start')
  start(@Req() req: Request, @Res() res: Response) {
    try {
      const redirectUri = computeRedirectUri(req);
      const codeVerifier = genCodeVerifier();
      const codeChallenge = codeChallengeFromVerifier(codeVerifier);
      const state = genState();

      res.cookie(CV_COOKIE, codeVerifier, { ...COOKIE_OPTS, maxAge: 5 * 60 * 1000 });
      res.cookie(ST_COOKIE, state,       { ...COOKIE_OPTS, maxAge: 5 * 60 * 1000 });

      const url = buildAuthUrlInline({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        redirectUri,
        calendar: false,
        state,
        codeChallenge,
      });

      return res
        .status(200)
        .type('html')
        .send(`<!doctype html>
<meta charset="utf-8">
<title>Redirigiendo a Google…</title>
<script>location.replace(${JSON.stringify(url)});</script>
Si no te redirige, <a href="${url}">haz clic aquí</a>.`);
    } catch (err) {
      console.error('google/start error:', err);
      throw new InternalServerErrorException('Error iniciando OAuth de Google');
    }
  }

  // 2) Inicio de OAuth pidiendo Calendar (consent) — idem HTML
  @Get('start-calendar')
  startCalendar(@Req() req: Request, @Res() res: Response) {
    try {
      const redirectUri = computeRedirectUri(req);
      const codeVerifier = genCodeVerifier();
      const codeChallenge = codeChallengeFromVerifier(codeVerifier);
      const state = genState();

      res.cookie(CV_COOKIE, codeVerifier, { ...COOKIE_OPTS, maxAge: 5 * 60 * 1000 });
      res.cookie(ST_COOKIE, state,       { ...COOKIE_OPTS, maxAge: 5 * 60 * 1000 });

      const url = buildAuthUrlInline({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        redirectUri,
        calendar: true,
        state,
        codeChallenge,
      });

      return res
        .status(200)
        .type('html')
        .send(`<!doctype html>
<meta charset="utf-8">
<title>Redirigiendo a Google…</title>
<script>location.replace(${JSON.stringify(url)});</script>
Si no te redirige, <a href="${url}">haz clic aquí</a>.`);
    } catch (err) {
      console.error('google/start-calendar error:', err);
      throw new InternalServerErrorException('Error iniciando OAuth de Google Calendar');
    }
  }

  // 3) Callback de Google
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const savedState = (req as any).cookies?.[ST_COOKIE];
    const codeVerifier = (req as any).cookies?.[CV_COOKIE];

    // limpiar cookies
    res.clearCookie(CV_COOKIE, COOKIE_OPTS);
    res.clearCookie(ST_COOKIE, COOKIE_OPTS);

    if (!code || !state || !savedState || !codeVerifier || state !== savedState) {
      throw new BadRequestException('Invalid OAuth callback');
    }

    const tokens = await this.google.exchangeCode({ code, codeVerifier });
    const payload = await this.google.verifyIdToken(tokens.id_token);
    const user = await this.google.upsertUserFromGoogle(payload, tokens);

    const jwt = await this.auth.issueToken({
      id: user.id,
      correo: user.correo,
      rol: user.rol,
    });

    const redirectUrl = new URL(process.env.GOOGLE_OAUTH_REDIRECT_SUCCESS!);
    redirectUrl.searchParams.set('token', jwt);
    redirectUrl.searchParams.set('googleConnected', '1');
    return res.redirect(redirectUrl.toString());
  }

  // 4) Estado de conexión (requiere JWT)
  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  async status(@Req() req: any) {
    const userId = req.user?.sub;
    return this.google.getConnectionStatus(userId);
  }

  // 5) Desconectar Calendar (requiere JWT)
  @UseGuards(AuthGuard('jwt'))
  @Post('disconnect')
  async disconnect(@Req() req: any) {
    const userId = req.user?.sub;
    return this.google.revokeAndClear(userId);
  }

  // 6) Debug (sin auth): verifica envs y muestra URL construida (sin PKCE)
  @Get('debug')
  debug(@Req() req: Request, @Res() res: Response) {
    const env = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      configuredRedirectUri: process.env.GOOGLE_REDIRECT_URI,
      successRedirect: process.env.GOOGLE_OAUTH_REDIRECT_SUCCESS,
    };

    try {
      // Detecto desde dónde llega la request
      const proto =
        (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';

      // Callbacks que DEBEN estar en Google Cloud Console (ambos)
      const cb5173 = `${proto}://localhost:5173/api/auth/google/callback`;
      const cb3000 = `${proto}://localhost:3000/api/auth/google/callback`;

      // Construyo 2 sample URLs sin PKCE (solo inspección)
      const base = 'https://accounts.google.com/o/oauth2/v2/auth';
      const build = (redirectUri: string) => {
        const params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          redirect_uri: redirectUri,
          response_type: 'code',
          include_granted_scopes: 'true',
          access_type: 'offline',
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar.events',
          ].join(' '),
          state: 'debug-state',
          code_challenge: 'debug-challenge',
          code_challenge_method: 'S256',
          prompt: 'consent',
        });
        return `${base}?${params.toString()}`;
      };

      const sample5173 = build(cb5173);
      const sample3000 = build(cb3000);

      return res.json({
        env,
        callbacksYouShouldAllowInGoogleConsole: [cb3000, cb5173],
        tryTheseInBrowser: { sample3000, sample5173 },
      });
    } catch (e) {
      console.error('google/debug error:', e);
      return res.status(500).json({ env, error: String(e) });
    }
  }
}
