import Cryptr from 'cryptr';

const secret =
  typeof process.env.GOOGLE_OAUTH_ENCRYPTION_SECRET === 'string' ? process.env.GOOGLE_OAUTH_ENCRYPTION_SECRET : '';

const cryptr = new Cryptr(secret);

// add a prefix so we know if the token is encrypted or not
const prefix = '__encrypted__';

export function encryptToken(token: string) {
  if (token.startsWith(prefix)) {
    throw new Error('Token is already encrypted');
  }
  return prefix + cryptr.encrypt(token);
}

export function decryptToken(encryptedToken: string) {
  if (!encryptedToken.startsWith(prefix)) {
    throw new Error('Token is not encrypted');
  }
  return cryptr.decrypt(encryptedToken.replace(prefix, ''));
}
