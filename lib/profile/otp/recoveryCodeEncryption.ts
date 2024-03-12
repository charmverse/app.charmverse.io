import { recoveryCodeSecretKey } from 'config/constants';
import { decryptData, encryptData } from 'lib/utils/dataEncryption';

export function encryptRecoveryCode(text: string) {
  return encryptData(text, recoveryCodeSecretKey);
}

export function decryptRecoveryCode(encryptedString: string) {
  return String(decryptData(encryptedString, recoveryCodeSecretKey));
}
