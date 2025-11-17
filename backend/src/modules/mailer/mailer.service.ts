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
      return n.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      });
    } catch {
      return `$${n}`;
    }
  }

  private fmtDateTz(iso: string | Date, opts?: Intl.DateTimeFormatOptions) {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    return d.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      ...(opts || { dateStyle: 'medium', timeStyle: 'short' }),
    });
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

  // Solo mostramos un texto por recurso (QUINCHO / PISCINA / CANCHA…)
  const recursosHTML = input.recursos
    .map(
      (r) => `
        <tr>
          <td style="
            padding:6px 0;
            font-size:14px;
            color:${brand.dark};
          ">
            <span style="
              display:inline-block;
              width:8px;
              height:8px;
              border-radius:999px;
              background:${brand.primary};
              margin-right:8px;
            "></span>
            ${r.tipo}
          </td>
        </tr>
      `,
    )
    .join('');

  return `
    <div style="
      font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;
      background:linear-gradient(135deg, #fff6ec 0%, #ffffff 50%, #ffe9d3 100%);
      padding:24px;
    ">
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          max-width:640px;
          margin:0 auto;
          background:#ffffff;
          border-radius:18px;
          box-shadow:0 10px 28px rgba(0,0,0,0.09);
          overflow:hidden;
        "
      >
        <!-- Barra superior de acento -->
        <tr>
          <td style="height:8px; background:linear-gradient(90deg, #ffb26a, ${brand.primary}, #ffb26a)"></td>
        </tr>

        <tr>
          <td style="padding:28px 24px 24px 24px;">
            
            <!-- Logo centrado arriba del título -->
            <div style="text-align:center; margin-bottom:18px;">
              <img
                src="https://i.imgur.com/ZO3jeot.png"
                alt="Quincho Alto Bonito"
                style="max-width:130px; height:auto; display:inline-block;"
              />
            </div>

            <!-- Encabezado -->
            <div style="
              margin-bottom:6px;
              font-size:11px;
              letter-spacing:0.09em;
              text-transform:uppercase;
              color:${brand.primary};
              font-weight:600;
            ">
              Comprobante de reserva
            </div>

            <h1 style="margin:0 0 6px 0; color:${brand.dark}; font-size:22px;">
              ¡${input.estado === 'PAGADA' ? 'Pago recibido' : 'Reserva confirmada'}!
            </h1>

            <p style="margin:0 0 14px 0; color:#555; font-size:14px; line-height:1.5;">
              Hola <strong>${input.nombre}</strong>, estos son los detalles de tu reserva
              <strong>#${input.reservaId.slice(0, 8)}</strong>.
            </p>

            <div style="
              margin:0 0 20px 0;
              padding:16px 20px;
              background:#fdf7ec;
              border:1px solid ${brand.primary};
              border-radius:14px;
            ">
              <div style="
                font-size:12px;
                font-weight:600;
                color:${brand.primary};
                text-transform:uppercase;
                letter-spacing:0.08em;
                margin-bottom:6px;
              ">
                Resumen de tu reserva
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr>
                  <td style="color:#555; padding:2px 0;">Estado</td>
                  <td style="text-align:right; padding:2px 0; color:${brand.dark}; font-weight:600;">
                    ${input.estado}
                  </td>
                </tr>
                <tr>
                  <td style="color:#555; padding:2px 0;">Modalidad</td>
                  <td style="text-align:right; padding:2px 0; color:${brand.dark}; font-weight:600;">
                    ${input.modalidad}
                  </td>
                </tr>
                <tr>
                  <td style="color:#555; padding:2px 0;">Inicio</td>
                  <td style="text-align:right; padding:2px 0; color:${brand.dark}; font-weight:600;">
                    ${this.fmtDateTz(input.inicio)}
                  </td>
                </tr>
                <tr>
                  <td style="color:#555; padding:2px 0;">Fin</td>
                  <td style="text-align:right; padding:2px 0; color:${brand.dark}; font-weight:600;">
                    ${this.fmtDateTz(input.fin)}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Servicios -->
            <h3 style="margin:0 0 4px 0; color:${brand.dark}; font-size:16px;">
              Servicios reservados
            </h3>

            <div style="
              border-radius:12px;
              border:1px solid ${brand.primary};
              background:#fdf7ec;
              padding:10px 14px;
              margin-bottom:4px;
            ">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                ${recursosHTML}
                <tr>
                  <td style="
                    padding:10px 0;
                    border-top:1px solid ${brand.primary};
                    color:${brand.dark};
                    font-size:14px;
                  ">
                    <strong>Total</strong>
                  </td>
                  <td style="
                    padding:10px 0;
                    border-top:1px solid ${brand.primary};
                    text-align:right;
                    color:${brand.primary};
                    font-size:16px;
                    font-weight:700;
                  ">
                    ${this.fmtCLP(input.montoTotalCLP)}
                  </td>
                </tr>
              </table>
            </div>

            <p style="margin:18px 0 0 0; font-size:12px; color:#666; line-height:1.6;">
              Si necesitas modificar o cancelar, responde a este correo indicando tu número de reserva.
              <br/>
              Te esperamos en <strong>Quincho Alto Bonito</strong>.
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

    const from =
      process.env.SMTP_FROM || 'Quincho Alto Bonito <no-reply@tudominio.cl>';

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

    // Texto plano sin código de autorización ni buy_order
    const plain = `¡${
      params.estado === 'PAGADA' ? 'Pago recibido' : 'Reserva confirmada'
    }!
Reserva #${params.reservaId}
Cliente: ${params.nombre}

Estado: ${params.estado}
Modalidad: ${params.modalidad}
Inicio: ${this.fmtDateTz(params.inicio)}
Fin: ${this.fmtDateTz(params.fin)}
Total: ${this.fmtCLP(params.montoTotalCLP)}

Servicios:
${params.recursos
  .map((r) => `- ${r.tipo} — ${r.nombre}`)
  .join('\n')}
`;

    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject:
          params.estado === 'PAGADA'
            ? 'Pago recibido — Confirmación de reserva'
            : '¡Reserva confirmada! — Detalles',
        text: plain,
        html,
      });
      this.logger.log(`Email de confirmación enviado a ${params.to}`);
    } catch (e: any) {
      this.logger.error(
        `No se pudo enviar email a ${params.to}: ${e?.message || e}`,
      );
    }
  }
}
