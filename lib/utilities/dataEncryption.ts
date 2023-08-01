import crypto from 'crypto';

import { authSecret } from 'config/constants';

if (!authSecret) {
  throw new Error('authSecret not defined');
}

// Generate secret hash with crypto to use for encryption
const method = 'aes-256-cbc';
const key = crypto.createHash('sha512').update(authSecret).digest('hex').substring(0, 32);
const encryptionIV = crypto.createHash('sha512').update(authSecret).digest('hex').substring(0, 16);

// Encrypt data
export function encryptData(data: string | number | Record<string, any>) {
  const dataString: string = typeof data === 'string' ? data : JSON.stringify(data);

  const cipher = crypto.createCipheriv(method, key, encryptionIV);
  return Buffer.from(cipher.update(dataString, 'utf8', 'hex') + cipher.final('hex')).toString('base64'); // Encrypts data and converts to hex and base64
}

// Decrypt data
export function decryptData(encryptedData: string): string | number | Record<string, any> | null {
  try {
    const buff = Buffer.from(encryptedData, 'base64');
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
