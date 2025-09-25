export const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const isValidPhoneCL = (v: string) =>
  /^\+569\d{8}$/.test(v);

export const isStrongPassword = (v: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
