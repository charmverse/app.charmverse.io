import { recoveryCodeSecretKey } from '@packages/utils/constants';
import { decryptData, encryptData } from '@packages/utils/dataEncryption';

export function encryptRecoveryCode(text: string) {
  return encryptData(text, recoveryCodeSecretKey);
}

export function decryptRecoveryCode(encryptedString: string) {
  return String(decryptData(encryptedString, recoveryCodeSecretKey));
}
