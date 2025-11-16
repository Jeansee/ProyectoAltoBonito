// src/modules/tbk/tbk.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} from 'transbank-sdk';
import type { Prisma } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';

function makeOptions() {
  const env = (process.env.TBK_ENV || 'TEST').toUpperCase();
  if (env === 'LIVE') {
    return new Options(
      process.env.TBK_COMMERCE_CODE!,
      process.env.TBK_API_KEY!,
      Environment.Production
    );
  }
  return new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
}

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {};
}

// ✅ shims para evitar errores de tipos si el @prisma/client está desfasado
const LIT = {
  metodoTransbank: 'TRANSBANK' as unknown as Prisma.PagoCreateInput['metodoPago'],
  epInitiated: 'INITIATED' as unknown as Prisma.PagoCreateInput['estado'],
  epPending: 'PENDING' as unknown as Prisma.PagoUpdateInput['estado'],
  epApproved: 'APPROVED' as unknown as Prisma.PagoUpdateInput['estado'],
  epRejected: 'REJECTED' as unknown as Prisma.PagoUpdateInput['estado'],
};

@Injectable()
export class TbkService {
  private readonly logger = new Logger(TbkService.name);

  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {}

  public getReturnUrl() {
    return process.env.TBK_RETURN_URL || 'http://localhost:3000/api/tbk/return';
  }
  public getFinalUrl() {
    return process.env.TBK_FINAL_URL || 'http://localhost:5173/pago/ok';
  }

  private mapEstadoPagoTBK(result: any) {
    if (result?.status === 'AUTHORIZED' && result?.response_code === 0) return LIT.epApproved;
    if (result?.status === 'INITIALIZED') return LIT.epPending;
    if (result?.status === 'FAILED' || result?.response_code !== 0) return LIT.epRejected;
    return LIT.epPending;
  }

  async createTransaction(reservaId: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id: reservaId } });
    if (!reserva) throw new BadRequestException('Reserva no encontrada');
    if (!Number.isFinite(reserva.montoTotalCLP) || reserva.montoTotalCLP <= 0) {
      throw new BadRequestException('Monto inválido');
    }

    const buyOrder  = `R-${reserva.id}`.slice(0, 26);
    const sessionId = `U-${reserva.usuarioId}`.slice(0, 61);
    const amount    = reserva.montoTotalCLP;
    const returnUrl = this.getReturnUrl();

    const tx = new WebpayPlus.Transaction(makeOptions());
    const resp = await tx.create(buyOrder, sessionId, amount, returnUrl); // { url, token }

    const prevMeta = asObj(reserva.metadata);
    const prevTbk  = asObj(prevMeta.tbk);
    const newMeta  = {
      ...prevMeta,
      tbk: {
        ...prevTbk,
        token: resp.token,
        buyOrder,
        sessionId,
        amount,
        status: 'INITIALIZED',
        createdAt: new Date().toISOString(),
      },
    };

    const pagoCreateData: Prisma.PagoCreateInput = {
      reserva: { connect: { id: reserva.id } },
      estado: LIT.epInitiated,
      montoCLP: amount,
      metodoPago: LIT.metodoTransbank,
      // @ts-ignore
      tbkToken: resp.token,
      // @ts-ignore
      tbkBuyOrder: buyOrder,
      // @ts-ignore
      tbkSessionId: sessionId,
      // @ts-ignore
      tbkStatus: 'INITIALIZED',
    } as unknown as Prisma.PagoCreateInput;

    await this.prisma.$transaction([
      this.prisma.reserva.update({
        where: { id: reserva.id },
        data: { metadata: newMeta },
      }),
      this.prisma.pago.create({ data: pagoCreateData }),
    ]);

    return { url: resp.url, token: resp.token };
  }

  async commit(tokenWs: string) {
    const tx = new WebpayPlus.Transaction(makeOptions());
    const result = await tx.commit(tokenWs);

    // Si tu cliente viejo no “conoce” tbkToken, usa where de tipo any
    let pago = await (this.prisma.pago as any).findFirst({ where: { tbkToken: tokenWs } });

    let reservaId = pago?.reservaId ?? null;
    if (!reservaId) {
      const r = await this.prisma.reserva.findFirst({
        where: { metadata: { path: ['tbk', 'token'], equals: tokenWs } as any },
        select: { id: true },
      });
      reservaId = r?.id ?? null;
    }
    if (!reservaId) throw new BadRequestException('No se encontró la reserva asociada al token_ws');

    const estado = this.mapEstadoPagoTBK(result);

    // Actualizar/crear Pago
    if (pago) {
      const updateData: Prisma.PagoUpdateInput = {
        estado,
        // @ts-ignore
        tbkStatus: result.status ?? null,
        // @ts-ignore
        tbkAuthorizationCode: result.authorization_code ?? null,
        updatedAt: new Date(),
      } as unknown as Prisma.PagoUpdateInput;

      await this.prisma.pago.update({
        where: { id: pago.id },
        data: updateData,
      });
    } else {
      const createData: Prisma.PagoCreateInput = {
        reserva: { connect: { id: reservaId } },
        estado,
        montoCLP: Number(result.amount ?? 0) || 0,
        metodoPago: LIT.metodoTransbank,
        // @ts-ignore
        tbkToken: tokenWs,
        // @ts-ignore
        tbkBuyOrder: result.buy_order ?? null,
        // @ts-ignore
        tbkSessionId: result.session_id ?? null,
        // @ts-ignore
        tbkStatus: result.status ?? null,
        // @ts-ignore
        tbkAuthorizationCode: result.authorization_code ?? null,
      } as unknown as Prisma.PagoCreateInput;

      pago = await this.prisma.pago.create({ data: createData });
    }

    // Actualizar Reserva (+ metadata TBK)
    const reservaPrev = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      select: { metadata: true },
    });

    const prevMeta = asObj(reservaPrev?.metadata);
    const prevTbk  = asObj(prevMeta.tbk);
    const newMeta  = {
      ...prevMeta,
      tbk: {
        ...prevTbk,
        status: result.status,
        response_code: result.response_code,
        authorization_code: result.authorization_code ?? null,
        transaction_date: result.transaction_date ?? null,
        card_detail: result.card_detail ?? null,
        payment_type_code: result.payment_type_code ?? null,
        updatedAt: new Date().toISOString(),
      },
    };

    // 🔥 Aquí decidimos el estado de la reserva según el resultado del pago
    const reservaUpdateData: Prisma.ReservaUpdateInput = {
      metadata: newMeta,
    } as any;

    if (String(estado) === 'APPROVED') {
      (reservaUpdateData as any).estado = 'CONFIRMADA';
    } else if (String(estado) === 'REJECTED') {
      (reservaUpdateData as any).estado = 'CANCELADA';
    }

    const reserva = await this.prisma.reserva.update({
      where: { id: reservaId },
      data: reservaUpdateData,
      include: {
        usuario: true,
        recursos: { include: { recurso: true } },
      },
    });

    // 📧 Enviar email solo si aprobado
    if (String(estado) === 'APPROVED') {
      try {
        await this.mailer.sendReservaConfirmada({
          to: reserva.usuario.correo,
          nombre: `${reserva.usuario.nombre} ${reserva.usuario.apellido ?? ''}`.trim(),
          reservaId: reserva.id,
          estado: reserva.estado as 'CONFIRMADA' | 'PAGADA',
          modalidad: reserva.modalidad,
          inicio: reserva.inicio,
          fin: reserva.fin,
          montoTotalCLP: reserva.montoTotalCLP,
          recursos: reserva.recursos.map(rr => ({
            nombre: rr.recurso.nombre,
            tipo: rr.recurso.tipo,
            precioFinalCLP: rr.precioFinalCLP,
          })),
          tbkAuthorizationCode: result.authorization_code ?? null,
          tbkBuyOrder: result.buy_order ?? null,
        });
      } catch (e: any) {
        this.logger.warn(`No se pudo enviar confirmación por email para reserva ${reserva.id}: ${e?.message || e}`);
      }
    }

    return result;
  }
}
