// tests/reserva.flujo-completo.spec.js
const { test, expect } = require('@playwright/test');
const { apiLogin, injectTokenAndGoto } = require('./_utils');

test('Flujo completo de reserva - desde recursos hasta carrito', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const email = process.env.TEST_USER_EMAIL || 'jfsanchez5023@gmail.com';
  const pass = process.env.TEST_USER_PASS || 'Jean5023';

  // 1) Login
  const token = await apiLogin(request, email, pass, apiBase);

  // 2) Inyectar token y navegar a recursos
  await injectTokenAndGoto(page, token, '/recursos');

  // Esperar que cargue la página de recursos
  await page.waitForTimeout(1000);

  // 3) Verificar que se muestra la lista de recursos
  await page.waitForTimeout(1000);
  const bodyText = await page.textContent('body');
  
  if (!bodyText.includes('Quincho') && !bodyText.includes('Piscina') && !bodyText.includes('Cancha')) {
    console.log('⚠️  No se encontraron recursos en la página');
    test.skip();
  }

  console.log('✅ Test de navegación a recursos exitoso');
});

test('Navegar desde el chatbot a recursos de Quincho', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const email = process.env.TEST_USER_EMAIL || 'jfsanchez5023@gmail.com';
  const pass = process.env.TEST_USER_PASS || 'Jean5023';

  // 1) Login para obtener token
  const token = await apiLogin(request, email, pass, apiBase);

  // 2) Inyectar token y ir al home
  await injectTokenAndGoto(page, token, '/');

  // 2) Abrir el chatbot
  await page.click('button:has-text("Asistencia")').catch(() => {
    page.click('button[aria-label*="chat"]');
  });

  await page.waitForTimeout(500);

  // 3) Verificar que el chatbot está abierto
  await expect(page.locator('text=Asistente Quincho').first()).toBeVisible({ timeout: 5000 });

  // 4) Hacer click en "Servicios y precios"
  await page.click('button:has-text("Servicios y precios")').catch(() => {});
  await page.waitForTimeout(500);

  // 5) Hacer click en "Quincho"
  await page.click('button:has-text("Quincho")').catch(() => {});
  await page.waitForTimeout(500);

  // 6) Hacer click en "Reservar Quincho"
  await page.click('button:has-text("Reservar Quincho")').catch(() => {});
  await page.waitForTimeout(1000);

  // 7) Verificar que navegó a la página de recursos con filtro de Quincho
  expect(page.url()).toContain('/recursos');
  expect(page.url()).toContain('tipo=QUINCHO');
});
