import { InvalidInputError } from '@charmverse/core/errors';

import { generateUserAndSpace } from 'testing/setupDatabase';
import { createTestUserOtp, generateTestOtpToken } from 'testing/userOtp';

import { verifyOtpToken } from '../verifyOtpToken';

describe('createOtp', () => {
  it(`Should throw an error if code is not valid.`, async () => {
    const { user } = await generateUserAndSpace();
    await createTestUserOtp(user.id);

    await expect(verifyOtpToken(user.id, '123456')).rejects.toBeInstanceOf(InvalidInputError);
  });

  it(`Should succeed.`, async () => {
    const { user } = await generateUserAndSpace();
    const userOTP = await createTestUserOtp(user.id);
    const token = generateTestOtpToken({ ...user, userOTP });
    const delta = await verifyOtpToken(user.id, token);

    expect(delta).toBe(0);
  });
});
