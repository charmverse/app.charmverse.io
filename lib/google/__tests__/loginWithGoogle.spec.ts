import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { DisabledAccountError } from 'lib/utilities/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { loginWithGoogle } from '../loginWithGoogle';

const googleUserName = 'Test User Google Account';
const googleAvatarUrl = 'https://example.com/google-avatar-1.png';

jest.mock('../verifyGoogleToken', () => {
  return {
    verifyGoogleToken: (email: string) => ({ email } as any)
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
    const { user, space } = await generateUserAndSpaceWithApiToken();

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
});
