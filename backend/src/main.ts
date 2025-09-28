import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // ✅ Healthchecks sin importar prefijo
  const http = app.getHttpAdapter();
  http.get('/__ping', (_req, res) => res.json({ ok: true }));
  http.get('/api/__ping', (_req, res) => res.json({ ok: true }));

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
