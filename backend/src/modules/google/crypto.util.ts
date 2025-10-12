import * as crypto from 'crypto';

const KEY = (() => {
  const raw = process.env.OAUTH_ENC_KEY || '';
  if (raw.startsWith('base64:')) {
    return Buffer.from(raw.replace('base64:', ''), 'base64');
  }
  if (raw.startsWith('hex:')) {
    return Buffer.from(raw.replace('hex:', ''), 'hex');
  }
  // fallback: asume utf8 (no recomendado en prod)
  return Buffer.from(raw, 'utf8');
})();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
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
