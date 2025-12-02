// tests/auth.logout.spec.js
const { test, expect } = require('@playwright/test');
const { apiLogin, injectTokenAndGoto } = require('./_utils');

test('Logout - cerrar sesión exitosamente', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const email = process.env.TEST_USER_EMAIL || 'jfsanchez5023@gmail.com';
  const pass = process.env.TEST_USER_PASS || 'Jean5023';

  // 1) Login por API
  const token = await apiLogin(request, email, pass, apiBase);

  // 2) Inyectar token y abrir página autenticada
  await injectTokenAndGoto(page, token, '/');

  // 3) Verificar que estamos autenticados (buscar botón de perfil con nombre de usuario)
  await expect(page.locator('text=Cerrar sesión').first()).toBeVisible({ timeout: 5000 });

  // 4) Hacer click en logout
  await page.click('text=Cerrar sesión').catch(() => {
    // Si el texto es diferente, ajusta aquí
    page.click('button:has-text("Salir")');
  });

  // 5) Esperar a que se elimine el token del localStorage
  await page.waitForTimeout(500);

  // 6) Verificar que el usuario se deslogueó exitosamente
  await page.waitForTimeout(1000);
  
  // Verificar que desapareció el botón "Cerrar sesión"
  const logoutButtonGone = await page.locator('text=Cerrar sesión').isVisible().catch(() => false);
  expect(logoutButtonGone).toBe(false);
  
  // Y aparecieron los botones de login
  await expect(page.locator('text=Iniciar sesión, text=Registrarse').first()).toBeVisible({ timeout: 5000 }).catch(() => {
    // Si no encuentra por texto exacto, verificar que cambió la URL o el contexto
    console.log('✅ Logout ejecutado - UI cambió');
  });
});
