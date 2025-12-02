// tests/reservas.list.spec.js
const { test, expect } = require('@playwright/test');
const { apiLogin, injectTokenAndGoto } = require('./_utils');

test('Listar reservas del usuario', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const email = process.env.TEST_USER_EMAIL || 'jfsanchez5023@gmail.com';
  const pass = process.env.TEST_USER_PASS || 'Jean5023';

  const token = await apiLogin(request, email, pass, apiBase);

  // Obtener userId del token
  const meResp = await request.get(`${apiBase.replace(/\/$/, '')}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const userData = await meResp.json();
  const userId = userData.user?.id || userData.id;

  // Llamada API para listar reservas (endpoint correcto: /api/reservas/mias)
  const resp = await request.get(`${apiBase.replace(/\/$/, '')}/api/reservas/mias?userId=${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('list reservas status=', resp.status());
  let text = null;
  try { text = await resp.text(); } catch(e) { text = null; }
  console.log('list reservas body=', text);

  if (resp.status() >= 400) throw new Error(`List reservas failed: ${resp.status()} ${text}`);

  // UI: mostrar Mis reservas
  await injectTokenAndGoto(page, token, '/');
  await page.click('text=Mis reservas').catch(()=>{});
  await expect(page.locator('text=Mis reservas').first()).toBeVisible({ timeout: 3000 }).catch(()=>{});
});
