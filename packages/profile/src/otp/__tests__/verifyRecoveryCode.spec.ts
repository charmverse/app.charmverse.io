import { InvalidInputError } from '@charmverse/core/errors';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createTestUserOtp } from '@packages/testing/userOtp';

import { verifyRecoveryCode } from '../verifyRecoveryCode';

describe('verifyRecoveryCode', () => {
  it(`Should throw an error if code is not valid.`, async () => {
    const { user } = await generateUserAndSpace();
    await createTestUserOtp(user.id);

    await expect(verifyRecoveryCode(user.id, '123456')).rejects.toBeInstanceOf(InvalidInputError);
  });

  it(`Should succeed with a valid code`, async () => {
    const { user } = await generateUserAndSpace();
    const { backupCode } = await createTestUserOtp(user.id);
    const test = await verifyRecoveryCode(user.id, backupCode);

    expect(test).toBeTruthy();
  });
});
