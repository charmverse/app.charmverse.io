import { InvalidInputError } from '@charmverse/core/errors';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createTestUserOtp, generateTestOtpToken } from '@packages/testing/userOtp';

import { verifyOtpToken } from '../verifyOtpToken';

describe('verifyOtp', () => {
  it(`Should throw an error if code is not valid.`, async () => {
    const { user } = await generateUserAndSpace();
    await createTestUserOtp(user.id);

    await expect(verifyOtpToken(user.id, '123456')).rejects.toBeInstanceOf(InvalidInputError);
  });

  it(`Should succeed with a valid code`, async () => {
    const { user } = await generateUserAndSpace();
    const { otp } = await createTestUserOtp(user.id);
    const token = generateTestOtpToken(user.username, otp.secret);
    const delta = await verifyOtpToken(user.id, token);

    expect(delta).toBe(0);
  });
});
