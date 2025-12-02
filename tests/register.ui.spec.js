// tests/register.ui.spec.js
import { test, expect } from '@playwright/test';

function uniqueEmail() {
  return `test+${Date.now()}@example.com`;
}

test('Registro UI - flujo feliz (redirige a /login)', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/register');

  const email = process.env.TEST_EMAIL || uniqueEmail();
  const password = process.env.TEST_PASSWORD || 'Password123';

  await expect(page.locator('form')).toBeVisible();

  // Rellenar campos (usamos name attributes existentes)
  await page.fill('input[name="nombre"]', 'Usuario');
  await page.fill('input[name="apellido"]', 'Prueba');
  await page.fill('input[name="correo"]', email);
  await page.fill('input[name="telefono"]', '+56912345678');
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirm"]', password);
  await page.check('input[name="acepto"]');

  // Debug: ver qué requests se generan (temporal)
  page.on('request', req => {
    console.log('REQ ->', req.method(), req.url());
  });
  page.on('response', res => {
    console.log('RES <-', res.status(), res.url());
  });

  // Esperar la respuesta POST real que contenga /auth/register
  const [response] = await Promise.all([
    page.waitForResponse(res =>
      res.request().method() === 'POST' &&
      res.url().includes('/auth/register')
    ),
    page.click('button:has-text("Crear cuenta")')
  ]);

  console.log('register.status=', response.status());
  let body = null;
  try { body = await response.text(); } catch (e) { body = null; }
  console.log('register.body=', body);

  // Aceptamos 200/201 como éxito. Si no, fallamos con log claro.
  if (![200, 201].includes(response.status())) {
    throw new Error(`Registro falló: status=${response.status()} body=${body}`);
  }

  // UI: el componente muestra mensaje de éxito y redirige a /login tras timeout
  // Primero, intentar ver el mensaje (si existe)
  await page.waitForTimeout(300); // pequeño delay para render
  await page.locator('text=La cuenta fue creada con éxito').waitFor({ timeout: 5000 }).catch(()=>{});
  // Luego esperar la redirección que tu componente hace
  await page.waitForTimeout(3500);
  await expect(page).toHaveURL(/\/login$/);
});
