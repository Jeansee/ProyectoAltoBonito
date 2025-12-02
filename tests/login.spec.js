import { test, expect } from '@playwright/test';

test('Login exitoso del cliente', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await expect(page.locator('form')).toBeVisible();

  await page.locator('input[type="email"]').fill('jfsanchez5023@gmail.com');
  await page.locator('input[type="password"]').fill('Jean5023');

  const [response] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/auth/login') && resp.request().method() === 'POST'
    ),
    page.click('text=Ingresar'),
  ]);

  console.log('Status login:', response.status());
  let body = null;
  try { body = await response.text(); } catch (e) { body = null; }
  console.log('Login body/text:', body);

  // Aceptar 200 o 201 como éxito
  if (![200, 201].includes(response.status())) {
    throw new Error(`Login API falló: status=${response.status()} body=${body}`);
  }

  // Comprobar navegación al home (o a /home) — timeout aumentado por seguridad
  await expect(page).toHaveURL(/^(http:\/\/localhost:5173(\/(|home))?)$/, { timeout: 10000 }).catch(async () => {
    // fallback: si la URL no cambió, verificar un elemento del home visible después del login
    console.log('No redirigió a / o /home — verificando elemento del home...');
    await expect(page.locator('text=Reservar').first()).toBeVisible({ timeout: 8000 });
  });
});
