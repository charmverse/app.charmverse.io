import crypto from 'crypto';

import { authSecret } from '@packages/utils/constants';

const method = 'aes-256-cbc';

function getEncryptionKeys(encryptionKey?: string) {
  const decryptionKey = encryptionKey || authSecret;

  if (!decryptionKey) {
    throw new Error('authSecret not defined');
  }

  // Generate secret hash with crypto to use for encryption
  const key = crypto.createHash('sha512').update(decryptionKey).digest('hex').substring(0, 32);
  const encryptionIV = crypto.createHash('sha512').update(decryptionKey).digest('hex').substring(0, 16);

  return { key, encryptionIV };
}

// Encrypt data
export function encryptData(data: string | number | Record<string, any>, encryptionKey?: string) {
  const dataString: string = typeof data === 'string' ? data : JSON.stringify(data);
  const { key, encryptionIV } = getEncryptionKeys(encryptionKey);

  const cipher = crypto.createCipheriv(method, key, encryptionIV);
  return Buffer.from(cipher.update(dataString, 'utf8', 'hex') + cipher.final('hex')).toString('base64'); // Encrypts data and converts to hex and base64
}

// Decrypt data
export function decryptData(
  encryptedData: string,
  encryptionKey?: string
): string | number | Record<string, any> | null {
  try {
    const buff = Buffer.from(encryptedData, 'base64');
    const { key, encryptionIV } = getEncryptionKeys(encryptionKey);
    const decipher = crypto.createDecipheriv(method, key, encryptionIV);

    const decrypted = decipher.update(buff.toString('utf8'), 'hex', 'utf8') + decipher.final('utf8'); // Decrypts data and converts to utf8

    try {
      return JSON.parse(decrypted);
    } catch (e) {
      return decrypted;
    }
  } catch (e) {
    return null;
  }
}
