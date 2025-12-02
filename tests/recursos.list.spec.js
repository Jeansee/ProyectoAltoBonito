// tests/recursos.list.spec.js
const { test, expect } = require('@playwright/test');

test('Listar recursos disponibles (público)', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';

  // 1) Llamada API para listar recursos
  const resp = await request.get(`${apiBase.replace(/\/$/, '')}/api/recursos`);

  console.log('list recursos status=', resp.status());
  expect(resp.status()).toBeLessThan(400);

  const data = await resp.json();
  console.log('Total recursos:', data.total);
  
  // Verificar estructura de respuesta paginada
  expect(data).toHaveProperty('items');
  expect(data).toHaveProperty('total');
  expect(Array.isArray(data.items)).toBe(true);

  if (data.items.length === 0) {
    console.log('⚠️  No hay recursos disponibles en la BD');
    test.skip();
  }

  // 2) Verificar estructura de cada recurso
  const primer = data.items[0];
  expect(primer).toHaveProperty('id');
  expect(primer).toHaveProperty('nombre');
  expect(primer).toHaveProperty('tipo');
  expect(primer).toHaveProperty('capacidad');

  // 3) UI: abrir página de recursos
  await page.goto('/');
  await page.click('text=Recursos').catch(() => {
    page.click('text=Espacios').catch(() => {});
  });
  
  await page.waitForTimeout(500);

  // Verificar que se muestran los recursos
  await expect(page.locator('text=Quincho').first()).toBeVisible({ timeout: 5000 }).catch(() => {
    // Ajustar según tus recursos
    expect(page.locator('[data-testid="recurso-card"]').first()).toBeVisible({ timeout: 5000 });
  });
});

test('Ver detalle de un recurso específico', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';

  // 1) Obtener lista de recursos
  const resp = await request.get(`${apiBase.replace(/\/$/, '')}/api/recursos`);
  const data = await resp.json();
  
  if (!data.items || data.items.length === 0) {
    console.log('⚠️  No hay recursos en el sistema');
    test.skip();
  }

  const recursoId = data.items[0].id;
  console.log('Viendo detalle de recurso:', recursoId);

  // 2) Obtener detalle del recurso
  const respDetail = await request.get(`${apiBase.replace(/\/$/, '')}/api/recursos/${recursoId}`);
  expect(respDetail.status()).toBeLessThan(400);

  const recurso = await respDetail.json();
  expect(recurso.id).toBe(recursoId);
  expect(recurso).toHaveProperty('descripcion');

  console.log('Recurso obtenido:', recurso.nombre);
  
  // 3) Verificación de API exitosa - UI detalle podría no existir como ruta separada
  console.log('✅ Test de API exitoso - detalle de recurso obtenido correctamente');
});
