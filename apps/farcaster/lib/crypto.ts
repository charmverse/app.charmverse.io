import crypto from 'node:crypto';

import { authSecret } from '@packages/utils/constants';

function getKey() {
  if (!authSecret) {
    throw new Error('The AUTH_SECRET env var is required to encrypt data');
  }
  return new Uint8Array(crypto.createHash('sha256').update(authSecret).digest());
}

export function encrypt(data: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), new Uint8Array(Buffer.alloc(16, 0)));
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(encryptedData: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), new Uint8Array(Buffer.alloc(16, 0)));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
