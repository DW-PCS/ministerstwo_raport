import { AuthUserPayload } from '@/lib/types';

export function getAppOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export function base64UrlEncode(buffer: ArrayBufferLike | Uint8Array): string {
  return btoa(
    String.fromCharCode.apply(null, [
      ...(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)),
    ])
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function parseJwtPayload(token: string | null): AuthUserPayload | null {
  if (!token) {
    return null;
  }

  const tokenParts = token.split('.');
  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payloadBytes = Uint8Array.from(atob(paddedBase64), character => character.charCodeAt(0));
    const payload = new TextDecoder().decode(payloadBytes);
    return JSON.parse(payload) as AuthUserPayload;
  } catch {
    return null;
  }
}
