// src/modules/google/crypto.util.ts
import * as crypto from 'crypto';

// =========================
//   GENERAR KEY DE 32 BYTES
// =========================
function resolveKey(): Buffer {
  const raw = process.env.OAUTH_ENC_KEY || '';

  if (raw.startsWith('base64:')) {
    const buf = Buffer.from(raw.replace('base64:', ''), 'base64');
    if (buf.length !== 32) {
      console.warn("[Google] OAUTH_ENC_KEY (base64) no tiene 32 bytes. Generando fallback temporal.");
      return crypto.randomBytes(32);
    }
    return buf;
  }

  if (raw.startsWith('hex:')) {
    const buf = Buffer.from(raw.replace('hex:', ''), 'hex');
    if (buf.length !== 32) {
      console.warn("[Google] OAUTH_ENC_KEY (hex) no tiene 32 bytes. Generando fallback temporal.");
      return crypto.randomBytes(32);
    }
    return buf;
  }

  // ❗ Fallback: utf8 → debe ser EXACTO 32 chars
  if (raw.length === 32) {
    return Buffer.from(raw, 'utf8');
  }

  console.warn("[Google] OAUTH_ENC_KEY no definido o inválido. Usando fallback temporal (NO usar en producción).");
  return crypto.randomBytes(32);
}

const KEY = resolveKey();

// =========================
//    ENCRIPTAR / DESENCRIPTAR
// =========================

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12); // GCM requiere 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);

  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}.${enc.toString('base64')}.${tag.toString('base64')}`;
}

export function decrypt(payload: string): string {
  const [ivB64, dataB64, tagB64] = payload.split('.');

  const iv = Buffer.from(ivB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);

  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}
