import Cryptr from 'cryptr';

const SECRET_KEY = 'myTotallySecretKey'; // This will be stored in a .env file or userOTP

export function encryptString(text: string) {
  const cryptr = new Cryptr(SECRET_KEY);

  return cryptr.encrypt(text);
}

export function decryptString(encryptedString: string) {
  const cryptr = new Cryptr(SECRET_KEY);

  return cryptr.decrypt(encryptedString);
}
