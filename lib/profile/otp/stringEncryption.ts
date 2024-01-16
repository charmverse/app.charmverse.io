import Cryptr from 'cryptr';

const RECOVERY_CODE_SECRET_KEY = process.env.RECOVERY_CODE_SECRET_KEY as string;

export function encryptString(text: string) {
  const cryptr = new Cryptr(RECOVERY_CODE_SECRET_KEY);

  return cryptr.encrypt(text);
}

export function decryptString(encryptedString: string) {
  const cryptr = new Cryptr(RECOVERY_CODE_SECRET_KEY);

  return cryptr.decrypt(encryptedString);
}
