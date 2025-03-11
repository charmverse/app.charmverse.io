import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { getTestUserOtp, updateTestUserOtp } from '@packages/testing/userOtp';
import { v4 as uuid } from 'uuid';

import type { CreateOtpResponse } from '../createUserOtp';
import { createUserOtp } from '../createUserOtp';

describe('createUserOtp', () => {
  it('Should create a user otp', async () => {
    const { user } = await generateUserAndSpace();
    await createUserOtp(user.id);

    expect(await getTestUserOtp(user.id)).not.toBeNull();
  });

  it('Should create the same userOtp and a new recoveryPhrase if userOtp is defined but not activated', async () => {
    const { user } = await generateUserAndSpace();
    const oldUserOtp = await createUserOtp(user.id);
    const newUserOtpRequest = await createUserOtp(user.id);

    (Object.keys(newUserOtpRequest) as (keyof CreateOtpResponse)[]).forEach((key) => {
      if (key === 'recoveryCode') {
        expect(newUserOtpRequest[key]).not.toEqual(oldUserOtp[key]);
      } else {
        expect(newUserOtpRequest[key]).toEqual(oldUserOtp[key]);
      }
    });
  });

  it('Should throw an error if user does not exist', async () => {
    const userId = uuid();
    await expect(createUserOtp(userId)).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
