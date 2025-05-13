import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { DisabledAccountError } from '@packages/utils/errors';
import { v4 } from 'uuid';

import { loginWithGoogle } from '../loginWithGoogle';

const googleUserName = 'Test User Google Account';
const googleAvatarUrl = 'https://example.com/google-avatar-1.png';

jest.mock('../verifyGoogleToken', () => {
  return {
    verifyGoogleToken: (email: string) => ({ email }) as any
  };
});
afterAll(async () => {
  jest.resetModules();
});

describe('loginWithGoogle', () => {
  it('should create a new user if the google account is not associated with any user', async () => {
    const testEmail = `test-${v4()}@example.com`;

    const newUser = await loginWithGoogle({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName
    });

    expect(newUser.googleAccounts).toHaveLength(1);
    expect(newUser.googleAccounts[0].email).toEqual(testEmail);
  });

  it('should update existing user google account details with the most up to date google display name and avatar', async () => {
    const testEmail = `test-${v4()}@example.com`;

    const newUser = await loginWithGoogle({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName
    });

    const newGoogleUserName = 'Test User Google Account - New Name';
    const newGoogleAvatarUrl = 'https://example.com/google-avatar-1-new.png';

    const updatedUser = await loginWithGoogle({
      accessToken: testEmail,
      avatarUrl: newGoogleAvatarUrl,
      displayName: newGoogleUserName
    });

    expect(updatedUser.id).toEqual(newUser.id);

    expect(newUser.googleAccounts).toHaveLength(1);
    expect(newUser.googleAccounts[0].email).toEqual(testEmail);
    expect(updatedUser.googleAccounts[0].name).toEqual(newGoogleUserName);
  });

  it('should fail if the user is marked as deleted', async () => {
    const { user, space } = await generateUserAndSpace();

    const testEmail = `test-${v4()}@example.com`;

    await prisma.googleAccount.create({
      data: {
        email: testEmail,
        name: googleUserName,
        avatarUrl: googleAvatarUrl,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        deletedAt: new Date()
      }
    });

    await expect(
      loginWithGoogle({
        accessToken: testEmail,
        avatarUrl: googleAvatarUrl,
        displayName: googleUserName
      })
    ).rejects.toBeInstanceOf(DisabledAccountError);
  });

  it('should pass login if the user has an existing verified email', async () => {
    const { user } = await generateUserAndSpace();

    const testEmail = `test-${v4()}@example.com`;

    await prisma.verifiedEmail.create({
      data: {
        email: testEmail,
        name: googleUserName,
        avatarUrl: googleAvatarUrl,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    const existingUser = await loginWithGoogle({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName
    });

    expect(existingUser.id).toEqual(user.id);
  });

  it('should return the user if they already have a notification email to the user account if they only have a Google Account', async () => {
    const email = `test-${Math.random()}@example.com`;
    const { user } = await generateUserAndSpace({
      user: { email }
    });

    const loginResult = await loginWithGoogle({
      accessToken: email
    });
    expect(loginResult.id).toBe(user.id);
    expect(loginResult.googleAccounts).toHaveLength(1);
    expect(loginResult.googleAccounts[0].email).toEqual(email);
  });
});
