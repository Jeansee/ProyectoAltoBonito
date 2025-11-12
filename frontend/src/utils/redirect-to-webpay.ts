// src/utils/redirect-to-webpay.ts
/**
 * Abre Webpay Plus enviando un POST con token_ws (en nueva pestaña).
 * @param url   La URL de Webpay que devolvió Transbank (resp.url)
 * @param token El token `token_ws` que devolvió Transbank (resp.token)
 */
export function redirectToWebpay(url: string, token: string) {
  if (!url || !token) throw new Error("Falta url o token para Webpay.");

  // Crear un formulario invisible para POST cross-origin
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.target = "_blank"; // nueva pestaña
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token_ws";
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();

  // Limpieza (no imprescindible, pero prolijo)
  setTimeout(() => {
    document.body.removeChild(form);
  }, 1000);
}
