import type { User, Otp } from '@charmverse/core/prisma-client';
import * as OTPAuth from 'otpauth';

import { decryptRecoveryCode, encryptRecoveryCode } from './recoveryCodeEncryption';

/**
 * Create an otp for the user to scan a QR code or enter the code manually
 * @param user User & { Otp?: Otp | null }
 * @returns The code and the uri
 */
export function createOtp(user: User & { otp?: Otp | null }) {
  const secret = new OTPAuth.Secret({ size: 10 });
  const userSecret = user.otp?.secret ? decryptRecoveryCode(user.otp?.secret) : secret.base32;

  const totp = new OTPAuth.TOTP({
    issuer: 'Charmverse',
    label: user.username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: userSecret
  });

  const uri = totp.toString();

  const code = OTPAuth.URI.parse(uri).secret.base32;

  const encryptedCode = user.otp?.secret || encryptRecoveryCode(code);

  return {
    encryptedCode,
    code,
    uri
  };
}
