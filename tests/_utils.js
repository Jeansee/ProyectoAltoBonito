// tests/_utils.js
const DEFAULT_API_BASE = process.env.API_BASE || 'http://localhost:3000';

function uniqueId() {
  return Date.now().toString();
}

/**
 * Hace login por API y devuelve el token (soporta respuestas con accessToken o token).
 * Llama a: POST ${apiBase}/api/auth/login
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} email
 * @param {string} password
 * @param {string} apiBase optional
 * @returns {Promise<string>} token
 */
async function apiLogin(request, email, password, apiBase = DEFAULT_API_BASE) {
  const url = `${apiBase.replace(/\/$/, '')}/api/auth/login`;
  const resp = await request.post(url, {
    data: { correo: email, password }
  });

  // debug
  // console.log('apiLogin', url, resp.status());

  if (![200, 201].includes(resp.status())) {
    const t = await resp.text().catch(() => null);
    throw new Error(`API login failed: ${resp.status()} ${t}`);
  }

  let json = null;
  try {
    json = await resp.json();
  } catch (e) {
    json = null;
  }

  const token = json?.accessToken || json?.token || json?.data?.accessToken || json?.data?.token;
  if (!token) {
    // si la API devuelve diferente estructura, devolvemos body como string para debug
    throw new Error(`No token in login response: ${JSON.stringify(json ?? (await resp.text()))}`);
  }
  return token;
}

/**
 * Inyecta token en localStorage antes de navegar y abre la url (ruta relativa a baseURL).
 * @param {import('@playwright/test').Page} page
 * @param {string} token
 * @param {string} route e.g. '/'
 */
async function injectTokenAndGoto(page, token, route = '/') {
  await page.addInitScript((t) => {
    window.localStorage.setItem('token', t);
  }, token);
  await page.goto(route);
}

module.exports = { uniqueId, apiLogin, injectTokenAndGoto, DEFAULT_API_BASE };
