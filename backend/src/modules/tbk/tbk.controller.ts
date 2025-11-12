import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { TbkService } from './tbk.service';

@Controller('tbk')
export class TbkController {
  constructor(private readonly tbk: TbkService) {}

  @Post('tx')
  async createTx(@Body('reservaId') reservaId: string) {
    return this.tbk.createTransaction(reservaId);
  }

  // Alias compatible con tu frontend actual
  @Post('create')
  async createAlias(@Body('reservaId') reservaId: string) {
    return this.tbk.createTransaction(reservaId);
  }

  // POST de retorno (flujo estándar)
  @Post('return')
  async returnPost(
    @Body('token_ws') token_ws: string,
    @Body('TBK_TOKEN') tbk_token: string,
    @Res() res: Response
  ) {
    // Si el usuario canceló desde Webpay, llega TBK_TOKEN y NO token_ws
    if (tbk_token && !token_ws) {
      return res.redirect(303, `${this.tbk.getFinalUrl()}?status=CANCELED`);
    }
    if (!token_ws) return res.status(400).send('token_ws missing');

    const result = await this.tbk.commit(token_ws);
    const p = new URLSearchParams({
      status: String(result.status ?? ''),
      resp: String(result.response_code ?? ''),
      token_ws,
    });
    return res.redirect(303, `${this.tbk.getFinalUrl()}?${p.toString()}`);
  }

  // GET de retorno (por si tuvieras configurado GET en integración)
  @Get('return')
  async returnGet(@Query('token_ws') token_ws: string, @Res() res: Response) {
    if (!token_ws) return res.status(400).send('token_ws missing');
    const result = await this.tbk.commit(token_ws);
    const p = new URLSearchParams({
      status: String(result.status ?? ''),
      resp: String(result.response_code ?? ''),
      token_ws,
    });
    return res.redirect(303, `${this.tbk.getFinalUrl()}?${p.toString()}`);
  }
}
