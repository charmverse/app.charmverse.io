import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { v4 as uuid } from 'uuid';

import { generateUserAndSpace } from 'testing/setupDatabase';
import { getUserOtp, updateUserOtp } from 'testing/userOtp';

import type { OtpResponse } from '../createUserOtp';
import { createUserOtp } from '../createUserOtp';

describe('createUserOtp', () => {
  it('Should create a user otp', async () => {
    const { user } = await generateUserAndSpace();
    expect(user.userOTP).toBeNull();

    await createUserOtp(user.id);
    expect(await getUserOtp(user.id)).not.toBeNull();
  });

  it('Should create the same userOtp and a new recoveryPhrase if userOtp is defined but not activated', async () => {
    const { user } = await generateUserAndSpace();
    const oldUserOtp = await createUserOtp(user.id);
    const newUserOtpRequest = await createUserOtp(user.id);

    (Object.keys(newUserOtpRequest) as (keyof OtpResponse)[]).forEach((key) => {
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

  it('Should throw an error if user already has an otp', async () => {
    const { user } = await generateUserAndSpace();
    await createUserOtp(user.id);
    await updateUserOtp(user.id, { activatedAt: new Date() });

    await expect(createUserOtp(user.id)).rejects.toBeInstanceOf(InvalidInputError);
  });
});
