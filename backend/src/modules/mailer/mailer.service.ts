import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type CLP = number;

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP env vars missing – emails will not be sent.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true si usas 465 (TLS)
      auth: { user, pass },
    });
  }

  private fmtCLP(n: CLP) {
    try {
      return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
    } catch {
      return `$${n}`;
    }
  }

  private fmtDateTz(iso: string | Date, opts?: Intl.DateTimeFormatOptions) {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    return d.toLocaleString('es-CL', { timeZone: 'America/Santiago', ...(opts || { dateStyle: 'medium', timeStyle: 'short' }) });
  }

  private buildReservaConfirmadaHTML(input: {
    nombre: string;
    reservaId: string;
    estado: 'CONFIRMADA' | 'PAGADA';
    modalidad: string;
    inicio: Date;
    fin: Date;
    montoTotalCLP: number;
    recursos: { nombre: string; tipo: string; precioFinalCLP: number }[];
    tbkAuthorizationCode?: string | null;
    tbkBuyOrder?: string | null;
    brand?: { primary?: string; sand?: string; dark?: string };
  }) {
    const brand = {
      primary: input.brand?.primary ?? '#c14421',
      sand: input.brand?.sand ?? '#e5d0ac',
      dark: input.brand?.dark ?? '#1e1e1e',
    };

    const recursosHTML = input.recursos.map(r => `
      <tr>
        <td style="padding:8px 0;">${r.tipo} — <strong>${r.nombre}</strong></td>
        <td style="padding:8px 0; text-align:right;"><strong>${this.fmtCLP(r.precioFinalCLP)}</strong></td>
      </tr>
    `).join('');

    const tbk = (input.tbkAuthorizationCode || input.tbkBuyOrder) ? `
      <tr><td style="padding:2px 0;color:#666;">Código de Autorización:</td><td style="padding:2px 0; text-align:right;">${input.tbkAuthorizationCode ?? '-'}</td></tr>
      <tr><td style="padding:2px 0;color:#666;">Orden (buy_order):</td><td style="padding:2px 0; text-align:right;">${input.tbkBuyOrder ?? '-'}</td></tr>
    ` : '';

    return `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; background:#fff6ec; padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.08); overflow:hidden;">
          <tr><td style="height:8px; background:linear-gradient(90deg, #ffb26a, ${brand.primary}, #ffb26a)"></td></tr>
          <tr>
            <td style="padding:28px 24px;">
              <h1 style="margin:0 0 8px 0; color:${brand.dark}; font-size:22px;">¡${input.estado === 'PAGADA' ? 'Pago recibido' : 'Reserva confirmada'}!</h1>
              <p style="margin:0; color:#555;">Hola <strong>${input.nombre}</strong>, estos son los detalles de tu reserva <strong>#${input.reservaId.slice(0,8)}</strong>.</p>

              <div style="margin:18px 0; padding:16px; background:${brand.sand}22; border:1px solid ${brand.sand}; border-radius:12px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                  <tr><td style="color:#666;">Estado</td><td style="text-align:right;"><strong>${input.estado}</strong></td></tr>
                  <tr><td style="color:#666;">Modalidad</td><td style="text-align:right;"><strong>${input.modalidad}</strong></td></tr>
                  <tr><td style="color:#666;">Inicio</td><td style="text-align:right;"><strong>${this.fmtDateTz(input.inicio)}</strong></td></tr>
                  <tr><td style="color:#666;">Fin</td><td style="text-align:right;"><strong>${this.fmtDateTz(input.fin)}</strong></td></tr>
                  ${tbk}
                </table>
              </div>

              <h3 style="margin:0 0 8px 0; color:${brand.dark};">Servicios</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                ${recursosHTML}
                <tr><td style="padding:10px 0; border-top:1px solid #eee; color:${brand.dark};"><strong>Total</strong></td><td style="padding:10px 0; border-top:1px solid #eee; text-align:right; color:${brand.dark};"><strong>${this.fmtCLP(input.montoTotalCLP)}</strong></td></tr>
              </table>

              <p style="margin:20px 0 0 0; font-size:12px; color:#666;">
                Si necesitas modificar o cancelar, responde a este correo indicando tu número de reserva.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  async sendReservaConfirmada(params: {
    to: string;
    nombre: string;
    reservaId: string;
    estado: 'CONFIRMADA' | 'PAGADA';
    modalidad: string;
    inicio: Date;
    fin: Date;
    montoTotalCLP: number;
    recursos: { nombre: string; tipo: string; precioFinalCLP: number }[];
    tbkAuthorizationCode?: string | null;
    tbkBuyOrder?: string | null;
  }) {
    if (!this.transporter) {
      this.logger.warn(`Transporter not configured. Skipping email to ${params.to}`);
      return;
    }

    const from = process.env.SMTP_FROM || 'Quincho Alto Bonito <no-reply@tudominio.cl>';

    const html = this.buildReservaConfirmadaHTML({
      nombre: params.nombre,
      reservaId: params.reservaId,
      estado: params.estado,
      modalidad: params.modalidad,
      inicio: params.inicio,
      fin: params.fin,
      montoTotalCLP: params.montoTotalCLP,
      recursos: params.recursos,
      tbkAuthorizationCode: params.tbkAuthorizationCode ?? null,
      tbkBuyOrder: params.tbkBuyOrder ?? null,
      brand: { primary: '#c14421', sand: '#e5d0ac', dark: '#1e1e1e' },
    });

    const plain =
`¡${params.estado === 'PAGADA' ? 'Pago recibido' : 'Reserva confirmada'}!
Reserva #${params.reservaId}
Cliente: ${params.nombre}

Estado: ${params.estado}
Modalidad: ${params.modalidad}
Inicio: ${this.fmtDateTz(params.inicio)}
Fin: ${this.fmtDateTz(params.fin)}
Total: ${this.fmtCLP(params.montoTotalCLP)}
${params.tbkAuthorizationCode ? `Cod. Aut.: ${params.tbkAuthorizationCode}` : ''}${params.tbkBuyOrder ? `\nOrden: ${params.tbkBuyOrder}` : ''}

Servicios:
${params.recursos.map(r => `- ${r.tipo} — ${r.nombre}: ${this.fmtCLP(r.precioFinalCLP)}`).join('\n')}
`;

    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject: params.estado === 'PAGADA'
          ? '✅ Pago recibido — Confirmación de reserva'
          : '✅ Reserva confirmada — Detalles',
        text: plain,
        html,
      });
      this.logger.log(`Email de confirmación enviado a ${params.to}`);
    } catch (e: any) {
      this.logger.error(`No se pudo enviar email a ${params.to}: ${e?.message || e}`);
    }
  }
}
