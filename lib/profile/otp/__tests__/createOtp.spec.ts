import type { User, UserOTP } from '@charmverse/core/dist/cjs/prisma-client';

import { createOtp } from '../createOtp';

describe('createOtp', () => {
  const originalEnv = process.env || {};

  beforeEach(() => {
    jest.resetModules();
  });

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      RECOVERY_CODE_SECRET_KEY: '1234567890'
    };
  });

  afterAll(() => {
    jest.resetModules();
    process.env = originalEnv;
  });

  it(`Should generate a new secret code and uri.`, async () => {
    const user = { username: 'Test user' } as User;

    const otp = createOtp(user);

    expect(otp.code).toBeDefined();
    expect(otp.uri).toContain('otpauth://totp/Charmverse:');
  });

  it(`If a user already has a secret, the result should be the same.`, async () => {
    const user = { username: 'Test user' } as User;

    const otp = createOtp(user);

    const userWithOtp: User & { userOTP: UserOTP } = {
      ...user,
      userOTP: {
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
