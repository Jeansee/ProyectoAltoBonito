// src/lib/auth.ts

export function isLoggedIn(): boolean {
  // Aquí deberías revisar un token o sesión real
  return localStorage.getItem("user") !== null;
}

export function login() {
  localStorage.setItem("user", "true"); // Simulación
}

export function logout() {
  localStorage.removeItem("user");
}
