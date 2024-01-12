import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import type { User, UserOTP } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';

export type OtpResponse = {
  code: string;
  uri: string;
  recoveryCode: string;
};

export async function createUserOtp(userId: string): Promise<OtpResponse> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      userOTP: true
    }
  });

  if (!user) {
    throw new DataNotFoundError('User not found');
  }

  if (user.userOTP) {
    throw new InvalidInputError('User has an OTP created');
  }

  const createdOtp = createOtp(user);

  const generatedRecoveryCode = createRecoveryCode();

  const recoveryCode = await prisma.recoveryCode.create({
    data: {
      code: generatedRecoveryCode.hashedOtp
    }
  });

  await prisma.userOTP.create({
    data: {
      userId: user.id,
      secret: createdOtp.code,
      recoveryCodeId: recoveryCode.id
    }
  });

  return {
    ...createdOtp,
    recoveryCode: generatedRecoveryCode.otp
  };
}

/**
 * Create a otp for the user to scan a QR code or enter the code manually
 *
 * @param user User & { userOTP?: UserOTP | null }
 * @returns OtpResponse
 */
function createOtp(user: User & { userOTP?: UserOTP | null }) {
  const secret = new OTPAuth.Secret({ size: 10 });

  const totp = new OTPAuth.TOTP({
    issuer: 'Charmverse',
    label: user.username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: user.userOTP?.secret || secret.base32
  });

  const uri = totp.toString();

  const code = OTPAuth.URI.parse(uri).secret.base32;

  return {
    code,
    uri
  };
}

/**
 * Create a recovery code for the user and hash it.
 * Return the otp code because we need it one time to show it to the user before storing it as a hash
 *
 * @returns Promise<{ otp: string; hashedOtp: string }>
 */
function createRecoveryCode() {
  const otp = new OTPAuth.Secret({ size: 10 }).base32; // Create a random 16 character string
  const hashedOtp = bcrypt.hashSync(otp, 10); // Hash and salt the string

  return {
    hashedOtp,
    otp
  };
}
