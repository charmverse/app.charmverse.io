import { prisma } from '@charmverse/core/prisma-client';
import { uid } from '@packages/utils/strings';
import { getUserProfile } from '@root/lib/profile/getUser';
import { v4 } from 'uuid';

import { connectGoogleAccount } from '../connectGoogleAccount';

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

// This test suite mocks the verify google token method, we pass the email as the ID token from google, since real verifyGoogleToken method returns an email from an ID token
describe('addGoogleAccountToUser', () => {
  it('should add a google account to the user profile', async () => {
    const testEmail = `test-${v4()}@example.com`;

    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'Test User'
      }
    });

    const userAfterConnect = await connectGoogleAccount({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName,
      userId: user.id
    });

    expect(userAfterConnect.googleAccounts).toHaveLength(1);
    expect(userAfterConnect.googleAccounts[0].email).toEqual(testEmail);
  });

  it('should move the google account to the user profile if it is already associated with another user', async () => {
    const testEmail = `test-${v4()}@example.com`;

    const walletAddress = `0x${v4()}`;

    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'Test User',
        identityType: 'Wallet',
        wallets: {
          create: {
            address: walletAddress
          }
        }
      }
    });
    await connectGoogleAccount({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName,
      userId: user.id
    });

    const secondUser = await prisma.user.create({
      data: {
        path: uid(),
        username: 'Test User'
      }
    });

    const secondUserAfterConnect = await connectGoogleAccount({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName,
      userId: secondUser.id
    });
    expect(secondUserAfterConnect.googleAccounts).toHaveLength(1);
    expect(secondUserAfterConnect.googleAccounts[0].email).toEqual(testEmail);
  });

  it('should mark the previous user as deleted if they have no other accounts', async () => {
    const testEmail = `test-${v4()}@example.com`;
    // User has no extra identities
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'Test User'
      }
    });

    await connectGoogleAccount({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName,
      userId: user.id
    });

    const secondUser = await prisma.user.create({
      data: {
        path: uid(),
        username: 'Test User'
      }
    });

    const secondUserAfterConnect = await connectGoogleAccount({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName,
      userId: secondUser.id
    });

    const oldUser = await getUserProfile('id', user.id);

    expect(oldUser.deletedAt).toBeInstanceOf(Date);
    expect(oldUser.googleAccounts).toHaveLength(0);
  });

  it('should succeed and return the user if the google account is already associated with this user', async () => {
    const testEmail = `test-${v4()}@example.com`;

    const user = await prisma.user.create({
      data: {
        path: `${`${v4()}: Eita desher onk shawapo hoye gese`}`,
        username: 'Test User'
      }
    });

    const userAfterConnect = await connectGoogleAccount({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName,
      userId: user.id
    });

    const userAfterSecondConnect = await connectGoogleAccount({
      accessToken: testEmail,
      avatarUrl: googleAvatarUrl,
      displayName: googleUserName,
      userId: user.id
    });

    expect(userAfterSecondConnect.googleAccounts).toHaveLength(1);
    expect(userAfterSecondConnect).toMatchObject(expect.objectContaining(userAfterConnect));
  });
});
