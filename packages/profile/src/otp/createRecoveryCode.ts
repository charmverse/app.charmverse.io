import bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';

/**
 * Create a recovery code for the user and hash it.
 * @returns the hashed otp for safe storage and the original one for diplaying it one time for the user without storing it.
 */
export async function createRecoveryCode() {
  const otp = new OTPAuth.Secret({ size: 10 }).base32; // Create a random 16 character string
  const hashedOtp = await bcrypt.hash(otp, 10); // Hash and salt the string

  return {
    hashedOtp,
    otp
  };
}
