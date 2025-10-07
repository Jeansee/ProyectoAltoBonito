import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    bufferLogs: true,
    logger: ['error', 'warn', 'debug', 'log']
  });

  // Habilitar CORS
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true
  }));

  // Obtener el servicio Prisma y conectar
  const prismaService = app.get(PrismaService);
  await prismaService.$connect();

  // Healthchecks sin importar prefijo
  const http = app.getHttpAdapter();
  http.get('/__ping', (_req, res) => res.json({ ok: true }));
  http.get('/api/__ping', (_req, res) => res.json({ ok: true }));

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
