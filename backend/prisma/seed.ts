import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function horarios10a22() {
  return Array.from({ length: 7 }, (_, dia) => ({
    diaSemana: dia,
    abreMin: 10 * 60,   // 10:00
    cierraMin: 22 * 60, // 22:00
    activo: true,
  }));
}

async function createOrUpdateAdmin() {
  const correo = 'admin@alto-bonito.cl';
  const passwordPlano = 'Admin1234!';
  const password = await bcrypt.hash(passwordPlano, 10);

  await prisma.usuario.upsert({
    where: { correo },
    update: {
      nombre: 'Admin',
      apellido: 'AltoBonito',
      telefono: '+56912345678',
      rol: 'ADMIN',
      activo: true,
      password,
    },
    create: {
      nombre: 'Admin',
      apellido: 'AltoBonito',
      correo,
      telefono: '+56912345678',
      rol: 'ADMIN',
      activo: true,
      password,
      whatsapp: '+56912345678',
    },
  });

  console.log('✅ ADMIN:', correo, 'clave:', passwordPlano);
}

async function createSampleClient() {
  const correo = 'cliente@alto-bonito.cl';
  const passwordPlano = 'Cliente1234!';
  const password = await bcrypt.hash(passwordPlano, 10);

  await prisma.usuario.upsert({
    where: { correo },
    update: {
      nombre: 'Cliente',
      apellido: 'Demo',
      telefono: '+56987654321',
      rol: 'CLIENTE',
      activo: true,
      password,
    },
    create: {
      nombre: 'Cliente',
      apellido: 'Demo',
      correo,
      telefono: '+56987654321',
      rol: 'CLIENTE',
      activo: true,
      password,
      whatsapp: '+56987654321',
    },
  });

  console.log('✅ CLIENTE:', correo, 'clave:', passwordPlano);
}

async function seedRecurso(data: {
  nombre: string;
  tipo: 'QUINCHO' | 'PISCINA' | 'CANCHA';
  capacidad: number;
  ubicacion: string;
  precioHoraCLP: number;
  precioDiaCLP: number;
  precioBaseCLP: number;
  tiempoMinimo?: number;
  tiempoMaximo?: number;
  diasAnticipacion?: number;
  descripcion?: string;
}) {
  // 1) busca si ya existe por (tipo, nombre)
  const existing = await prisma.recurso.findFirst({
    where: { tipo: data.tipo as any, nombre: data.nombre },
    select: { id: true },
  });

  // Datos comunes (create/update)
  const baseData = {
    ...data,
    activo: true,
    tiempoMinimo: data.tiempoMinimo ?? 60,
    tiempoMaximo: data.tiempoMaximo ?? (data.tipo === 'CANCHA' ? 240 : 480),
    diasAnticipacion: data.diasAnticipacion ?? 30,
  };

  if (existing) {
    // 2) UPDATE si existe
    return prisma.recurso.update({
      where: { id: existing.id },
      data: {
        ...baseData,
        // si quieres, no toques horarios/turnos aquí para no duplicar:
        // quítalos del update y solo mantenlos en create
      },
    });
  }

  // 3) CREATE si no existe (con horarios + turno)
  return prisma.recurso.create({
    data: {
      ...baseData,
      horarios: { create: horarios10a22() },
      turnos: {
        create: [
          {
            nombre: 'Turno Noche',
            descripcion: 'Turno nocturno de fines de semana',
            inicioMin: 19 * 60, // 19:00
            finMin: 4 * 60,     // 04:00 del día siguiente
            diasSemana: [5, 6], // vie-sáb
            precioFijoCLP: Math.max(
              Math.floor(data.precioDiaCLP * 0.6),
              data.precioHoraCLP * 5
            ),
            activo: true,
          },
        ],
      },
    },
  });
}


async function main() {
  console.log('🌱 Seeding Quincho Alto Bonito…');
  await createOrUpdateAdmin();
  await createSampleClient();

  await seedRecurso({
    nombre: 'Quincho Principal',
    tipo: 'QUINCHO',
    capacidad: 40,
    ubicacion: 'Km 5, Alto Bonito',
    precioHoraCLP: 15000,
    precioDiaCLP: 120000,
    precioBaseCLP: 15000,
    descripcion: 'Espacio techado con parrilla, mesones y área de descanso.',
  });

  await seedRecurso({
    nombre: 'Piscina Exterior',
    tipo: 'PISCINA',
    capacidad: 20,
    ubicacion: 'Sector Piscina',
    precioHoraCLP: 12000,
    precioDiaCLP: 90000,
    precioBaseCLP: 12000,
    descripcion: 'Piscina al aire libre con áreas de descanso y duchas.',
  });

  await seedRecurso({
    nombre: 'Cancha Sintética',
    tipo: 'CANCHA',
    capacidad: 14,
    ubicacion: 'Sector Deportivo',
    precioHoraCLP: 10000,
    precioDiaCLP: 70000,
    precioBaseCLP: 10000,
    tiempoMaximo: 240,
    descripcion: 'Cancha multiuso ideal para fútbol y actividades recreativas.',
  });

  console.log('✅ Seed completo');
}

main().finally(() => prisma.$disconnect());
