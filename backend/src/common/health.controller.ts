import { Controller, Get } from '@nestjs/common';

@Controller() // <- sin prefijo aquí
export class HealthController {
  // Con app.setGlobalPrefix('api'), esta ruta final es: /api/__ping
  @Get('__ping')
  ping() {
    return { ok: true };
  }
}

