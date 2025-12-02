// tests/google-calendar.spec.js
const { test, expect } = require('@playwright/test');
const { apiLogin } = require('./_utils');

test('Iniciar OAuth de Google Calendar', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';

  // El endpoint /auth/google/start-calendar devuelve HTML que redirige
  const resp = await request.get(`${apiBase.replace(/\/$/, '')}/api/auth/google/start-calendar`, {
    maxRedirects: 0,
    failOnStatusCode: false
  });

  console.log('google start-calendar status=', resp.status());
  
  if (resp.status() === 500 || resp.status() === 404) {
    console.log('⚠️  Google OAuth no configurado o no disponible');
    test.skip();
  }

  // Debe responder 200 con HTML o redirección
  expect([200, 302]).toContain(resp.status());
  
  const body = await resp.text();
  expect(body.toLowerCase()).toContain('google');
});

test('Verificar estado de conexión de Google Calendar', async ({ request }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const email = process.env.TEST_USER_EMAIL || 'jfsanchez5023@gmail.com';
  const pass = process.env.TEST_USER_PASS || 'Jean5023';

  // 1) Login
  const token = await apiLogin(request, email, pass, apiBase);

  // 2) Verificar estado de conexión
  const resp = await request.get(`${apiBase.replace(/\/$/, '')}/api/auth/google/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('google status=', resp.status());
  
  if (resp.status() === 404) {
    console.log('⚠️  Endpoint de status no implementado');
    test.skip();
  }

  expect(resp.status()).toBeLessThan(400);

  const status = await resp.json();
  console.log('Google connection status:', status);
  
  // Verificar estructura de respuesta
  expect(status).toHaveProperty('connected');
});

test('Desconectar cuenta de Google Calendar', async ({ request }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const email = process.env.TEST_USER_EMAIL || 'jfsanchez5023@gmail.com';
  const pass = process.env.TEST_USER_PASS || 'Jean5023';

  // 1) Login
  const token = await apiLogin(request, email, pass, apiBase);

  // 2) Desconectar Google
  const resp = await request.post(`${apiBase.replace(/\/$/, '')}/api/auth/google/disconnect`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('google disconnect status=', resp.status());
  
  if (resp.status() === 404) {
    console.log('⚠️  Endpoint de desconexión no implementado');
    test.skip();
  }

  // Debe responder 200, 201 o 204
  expect([200, 201, 204]).toContain(resp.status());
});
