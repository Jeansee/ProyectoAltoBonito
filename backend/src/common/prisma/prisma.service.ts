// src/common/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // ❗️Sin anotar : PrismaClient
  public readonly prisma = new PrismaClient({ log: ['error', 'warn'] }).$extends({
    query: {
      usuario: {
        async create({ args, query }) {
          const data = args.data as any;
          if (data?.password && !String(data.password).startsWith('$2b$')) {
            data.password = await bcrypt.hash(data.password, 10);
          }
          return query(args);
        },
        async update({ args, query }) {
          const data = args.data as any;
          if (data?.password && !String(data.password).startsWith('$2b$')) {
            data.password = await bcrypt.hash(data.password, 10);
          }
          return query(args);
        },
      },
    },
  });

  async onModuleInit() { await this.prisma.$connect(); }
  async onModuleDestroy() { await this.prisma.$disconnect(); }
}
