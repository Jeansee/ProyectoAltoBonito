import * as crypto from 'crypto';

export function genCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}
export function codeChallengeFromVerifier(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return Buffer.from(hash).toString('base64url');
}
export function genState(): string {
  return crypto.randomBytes(16).toString('base64url');
}
