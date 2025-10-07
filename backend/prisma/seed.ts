// backend/prisma/seed.ts  (o donde lo ejecutes hoy)
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- helpers ---
function horarios10a22() {
  // 0=Dom ... 6=Sáb
  return Array.from({ length: 7 }, (_, dia) => ({
    diaSemana: dia,
    abreMin: 10 * 60,   // 10:00
    cierraMin: 22 * 60, // 22:00
    activo: true,
  }));
}

async function ensureHorarios10a22(recursoId: string) {
  const base = horarios10a22();
  for (const h of base) {
    // unique esperado: (recursoId, diaSemana)
    const existing = await prisma.horario.findFirst({
      where: { recursoId, diaSemana: h.diaSemana },
      select: { id: true },
    });

    if (existing) {
      await prisma.horario.update({
        where: { id: existing.id },
        data: { abreMin: h.abreMin, cierraMin: h.cierraMin, activo: true },
      });
    } else {
      await prisma.horario.create({
        data: { recursoId, ...h },
      });
    }
  }
}

async function ensureTurnoNoche(recursoId: string, precioDiaCLP: number, precioHoraCLP: number) {
  const nombre = 'Turno Noche';
  const existing = await prisma.turno.findFirst({
    where: { recursoId, nombre },
    select: { id: true },
  });

  const precioFijoCLP = Math.max(Math.floor(precioDiaCLP * 0.6), precioHoraCLP * 5);

  const payload = {
    nombre,
    descripcion: 'Turno nocturno de fines de semana',
    inicioMin: 19 * 60, // 19:00
    finMin: 4 * 60,     // 04:00 del día siguiente
    diasSemana: [5, 6], // viernes-sábado
    precioFijoCLP,
    activo: true,
  };

  if (existing) {
    await prisma.turno.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.turno.create({ data: { recursoId, ...payload } });
  }
}

// --- users ---
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

// --- recursos ---
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
  const baseData = {
    ...data,
    activo: true,
    tiempoMinimo: data.tiempoMinimo ?? 60,
    tiempoMaximo: data.tiempoMaximo ?? (data.tipo === 'CANCHA' ? 240 : 480),
    diasAnticipacion: data.diasAnticipacion ?? 30,
  };

  // busca (tipo, nombre)
  const existing = await prisma.recurso.findFirst({
    where: { tipo: data.tipo as any, nombre: data.nombre },
    select: { id: true, precioDiaCLP: true, precioHoraCLP: true },
  });

  let recursoId: string;

  if (existing) {
    const r = await prisma.recurso.update({
      where: { id: existing.id },
      data: baseData,
      select: { id: true, precioDiaCLP: true, precioHoraCLP: true },
    });
    recursoId = r.id;
    // Asegura horarios/turnos también en UPDATE
    await ensureHorarios10a22(recursoId);
    await ensureTurnoNoche(recursoId, r.precioDiaCLP, r.precioHoraCLP);
  } else {
    const r = await prisma.recurso.create({
      data: {
        ...baseData,
        // crea al vuelo el set inicial, pero igual usamos ensures por idempotencia
        horarios: { create: horarios10a22() },
      },
      select: { id: true, precioDiaCLP: true, precioHoraCLP: true },
    });
    recursoId = r.id;
    await ensureTurnoNoche(recursoId, r.precioDiaCLP, r.precioHoraCLP);
  }

  console.log(`✅ Recurso listo: ${data.nombre}`);
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

  // Además, si ya tenías recursos antiguos sin horarios, refuerza:
  const all = await prisma.recurso.findMany({ select: { id: true, nombre: true, precioDiaCLP: true, precioHoraCLP: true } });
  for (const r of all) {
    await ensureHorarios10a22(r.id);
    await ensureTurnoNoche(r.id, r.precioDiaCLP, r.precioHoraCLP);
  }

  console.log('✅ Seed completo');
}

main()
  .catch((e) => {
    console.error('❌ Seed error', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
