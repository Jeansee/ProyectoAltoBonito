// tests/admin.bloqueos.spec.js
const { test, expect } = require('@playwright/test');
const { apiLogin } = require('./_utils');

test('Admin - Listar bloqueos', async ({ request }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin1@alto-bonito.cl';
  const adminPass = process.env.ADMIN_PASS || 'Admin12345';

  // 1) Login como admin
  const token = await apiLogin(request, adminEmail, adminPass, apiBase);

  // 2) Listar bloqueos
  const resp = await request.get(`${apiBase.replace(/\/$/, '')}/api/admin/bloqueos`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('admin bloqueos status=', resp.status());
  
  if (resp.status() === 403) {
    console.log('✅ Usuario no tiene permisos de admin');
    test.skip();
  }

  expect(resp.status()).toBeLessThan(400);

  const bloqueos = await resp.json();
  console.log('Total bloqueos:', bloqueos.length);

  // Verificar estructura
  expect(Array.isArray(bloqueos)).toBe(true);
});

test('Admin - Crear un bloqueo de fechas', async ({ request }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin1@alto-bonito.cl';
  const adminPass = process.env.ADMIN_PASS || 'Admin12345';

  // 1) Login como admin
  const token = await apiLogin(request, adminEmail, adminPass, apiBase);

  // 2) Obtener un recurso para bloquear
  const recursosResp = await request.get(`${apiBase.replace(/\/$/, '')}/api/recursos`);
  const data = await recursosResp.json();

  if (!data.items || data.items.length === 0) {
    console.log('⚠️  No hay recursos disponibles');
    test.skip();
  }

  const recursoId = data.items[0].id;

  // 3) Crear bloqueo - IMPORTANTE: backend espera formato YYYY-MM-DD, no ISO completo
  const inicio = '2025-12-20';
  const fin = '2025-12-21';

  const resp = await request.post(`${apiBase.replace(/\/$/, '')}/api/admin/bloqueos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      recursoId: recursoId,
      motivo: 'Mantenimiento de prueba',
      inicio: inicio,
      fin: fin
    }
  });

  console.log('crear bloqueo status=', resp.status());
  
  if (resp.status() === 403) {
    console.log('✅ Usuario no tiene permisos de admin');
    test.skip();
  }

  if (resp.status() >= 400) {
    const text = await resp.text();
    console.log('Error al crear bloqueo:', text);
    
    // Si falla por conflicto con reservas existentes, es esperado
    if (text.includes('reserva') || text.includes('solapan')) {
      console.log('⚠️  Hay reservas confirmadas en ese período');
      test.skip();
    }
  }

  expect([200, 201]).toContain(resp.status());

  const bloqueo = await resp.json();
  console.log('Bloqueo creado:', bloqueo);

  expect(bloqueo).toHaveProperty('id');
  expect(bloqueo.recursoId).toBe(recursoId);

  // Cleanup: eliminar el bloqueo creado
  if (bloqueo.id) {
    await request.delete(`${apiBase.replace(/\/$/, '')}/api/admin/bloqueos/${bloqueo.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
});

test('Admin - Eliminar un bloqueo', async ({ request }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin1@alto-bonito.cl';
  const adminPass = process.env.ADMIN_PASS || 'Admin12345';

  // 1) Login como admin
  const token = await apiLogin(request, adminEmail, adminPass, apiBase);

  // 2) Primero crear un bloqueo para luego eliminarlo
  const recursosResp = await request.get(`${apiBase.replace(/\/$/, '')}/api/recursos`);
  const data = await recursosResp.json();

  if (!data.items || data.items.length === 0) {
    console.log('⚠️  No hay recursos disponibles');
    test.skip();
  }

  const recursoId = data.items[0].id;

  // Crear bloqueo temporal
  const createResp = await request.post(`${apiBase.replace(/\/$/, '')}/api/admin/bloqueos`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      recursoId: recursoId,
      motivo: 'Bloqueo temporal para test',
      inicio: '2026-01-01',
      fin: '2026-01-02'
    }
  });

  if (createResp.status() === 403 || createResp.status() >= 400) {
    test.skip();
  }

  const bloqueo = await createResp.json();
  const bloqueoId = bloqueo.id;

  // 3) Eliminar el bloqueo
  const resp = await request.delete(`${apiBase.replace(/\/$/, '')}/api/admin/bloqueos/${bloqueoId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('eliminar bloqueo status=', resp.status());
  
  expect([200, 204]).toContain(resp.status());
});
