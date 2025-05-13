import type { User, Otp } from '@charmverse/core/prisma-client';

import { createOtp } from '../createOtp';

describe('createOtp', () => {
  it(`Should generate a new secret code and uri.`, async () => {
    const user = { username: 'Test user' } as User;

    const otp = createOtp(user);

    expect(otp.code).toBeDefined();
    expect(otp.uri).toContain('otpauth://totp/Charmverse:');
  });

  it(`If a user already has a secret, the result should be the same.`, async () => {
    const user = { username: 'Test user' } as User;

    const otp = createOtp(user);

    const userWithOtp: User & { otp: Otp } = {
      ...user,
      otp: {
        id: '1',
        createdAt: new Date(),
        deletedAt: null,
        activatedAt: null,
        secret: otp.encryptedCode,
        recoveryCodeId: '1',
        userId: user.id
      }
    };

    const newOtp = createOtp(userWithOtp);

    expect(JSON.stringify(otp)).toEqual(JSON.stringify(newOtp));
  });
});
