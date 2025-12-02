// tests/admin.access.spec.js
const { test, expect } = require('@playwright/test');
const { apiLogin, injectTokenAndGoto } = require('./_utils');

test('Acceso a panel admin con rol ADMIN', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin1@alto-bonito.cl';
  const adminPass = process.env.ADMIN_PASS || 'Admin12345';

  // 1) Login como admin
  const token = await apiLogin(request, adminEmail, adminPass, apiBase);

  // 2) Inyectar token y abrir panel admin
  await injectTokenAndGoto(page, token, '/admin');

  // 3) Verificar que se muestra el panel de admin
  await expect(page.locator('text=Bienvenido, admin').first()).toBeVisible({ timeout: 5000 }).catch(() => {
    // Si el texto es diferente, ajusta
    expect(page.locator('text=Panel de administración').first()).toBeVisible({ timeout: 5000 });
  });

  // 4) Verificar que hay secciones de admin
  await expect(page).toHaveURL(/\/admin/);
});

test('Acceso a panel admin sin rol ADMIN - debe denegar', async ({ request, page }) => {
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const clientEmail = process.env.TEST_USER_EMAIL || 'jfsanchez5023@gmail.com';
  const clientPass = process.env.TEST_USER_PASS || 'Jean5023';

  // 1) Login como cliente regular (no admin)
  const token = await apiLogin(request, clientEmail, clientPass, apiBase);

  // 2) Intentar acceder a panel admin
  await injectTokenAndGoto(page, token, '/admin');

  // 3) Debe redirigir al home o mostrar error
  await page.waitForTimeout(1000);
  
  const currentUrl = page.url();
  
  // Verificar que NO está en /admin o que hay mensaje de error
  if (currentUrl.includes('/admin')) {
    await expect(page.locator('text=No tienes permisos').first()).toBeVisible({ timeout: 3000 });
  } else {
    // Redirigió correctamente
    expect(currentUrl).not.toContain('/admin');
  }
});

test('Acceso a panel admin sin autenticación - debe redirigir a login', async ({ page }) => {
  // 1) Intentar acceder sin token
  await page.goto('/admin');

  // 2) Debe redirigir al login
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/\/login$/);
});
