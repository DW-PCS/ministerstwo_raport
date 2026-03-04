import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';

const MICROSOFT_JWKS = createRemoteJWKSet(
  new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys')
);

function isMicrosoftIssuer(issuer: string | undefined): issuer is string {
  if (!issuer) {
    return false;
  }

  return /^https:\/\/login\.microsoftonline\.com\/[0-9a-fA-F-]+\/v2\.0$/.test(issuer);
}

export function getTokenRemainingSeconds(token: string): number | null {
  try {
    const payload = decodeJwt(token);
    if (!payload.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now;
  } catch {
    return null;
  }
}

export async function isValidToken(token: string): Promise<boolean> {
  try {
    const decoded = decodeJwt(token);
    const issuer = decoded.iss;

    if (!isMicrosoftIssuer(issuer)) {
      return false;
    }

    const audience = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID;
    if (!audience) {
      return false;
    }

    await jwtVerify(token, MICROSOFT_JWKS, {
      issuer,
      audience,
    });

    return true;
  } catch {
    return false;
  }
}
