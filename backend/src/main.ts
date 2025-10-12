// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';
import * as cookieParser from 'cookie-parser';        // 👈 agregado

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'debug', 'log'],
  });

  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 👇 cookies necesarias para OAuth (state/code_verifier)
  app.use(cookieParser());                             // 👈 agregado

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Prisma
  const prismaService = app.get(PrismaService);
  await prismaService.$connect();
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
