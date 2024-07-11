import { DisabledAccountError, ExternalServiceError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { verifySignInMessage } from '@farcaster/auth-kit';
import { InvalidStateError } from '@root/lib/middleware';

import { generateFarcasterUser, generateUserAndSpace } from 'testing/setupDatabase';

import type { LoginWithFarcasterParams } from '../loginWithFarcaster';
import { loginWithFarcaster } from '../loginWithFarcaster';

jest.mock('@farcaster/auth-kit', () => ({
  verifySignInMessage: jest.fn().mockResolvedValue({ success: true }),
  viemConnector: jest.fn().mockReturnValue({ rpcUrls: ['http://localhost:8545'] }),
  createAppClient: jest.fn().mockReturnValue({})
}));

const mockedVerifySignInMessage = jest.mocked(verifySignInMessage);

const defaultBody = {
  bio: 'biooo',
  displayName: 'My name',
  state: 'completed',
  nonce: '1235',
  url: 'https://example.com',
  signature: '0x1234',
  message: 'message'
} as LoginWithFarcasterParams;

describe('loginWithFarcaster', () => {
  afterEach(async () => {
    await prisma.userWallet.deleteMany({});
    await prisma.farcasterUser.deleteMany({});
  });

  test('should fail if the signature cannot be verified', async () => {
    mockedVerifySignInMessage.mockResolvedValueOnce({ success: false } as any);
    const body = { ...defaultBody, fid: Math.floor(Math.random() * 1000), username: '@test' };

    await expect(loginWithFarcaster(body)).rejects.toThrow(InvalidStateError);
  });

  test('should fail if no fid or no username in the body', async () => {
    const body = { ...defaultBody };

    await expect(loginWithFarcaster(body)).rejects.toThrowError(InvalidInputError);
  });

  test('should fail if user was deleted', async () => {
    const body = { ...defaultBody, fid: Math.floor(Math.random() * 1000), username: '@test' };

    const { user } = await generateUserAndSpace({
      user: {
        deletedAt: new Date()
      }
    });
    const farcasterUser = await generateFarcasterUser({
      userId: user.id,
      fid: body.fid
    });

    await expect(loginWithFarcaster(body)).rejects.toThrowError(DisabledAccountError);
  });

  test('should return the user', async () => {
    const body = { ...defaultBody, fid: Math.floor(Math.random() * 1000), username: '@test' };

    const { user } = await generateUserAndSpace();
    await generateFarcasterUser({
      userId: user.id,
      fid: body.fid
    });

    expect(await loginWithFarcaster(body)).toHaveProperty('id', user.id);
  });

  test('should add the farcaster account to a user which already has the a wallet address verified in Farcaster connected account', async () => {
    const walletAddress = '0x1234';
    const body: LoginWithFarcasterParams = {
      ...defaultBody,
      fid: Math.floor(Math.random() * 1000),
      username: '@test',
      verifications: [walletAddress]
    };

    const { user } = await generateUserAndSpace({
      walletAddress
    });

    const loggedInViaFarcaster = await loginWithFarcaster(body);

    expect(loggedInViaFarcaster.id).toBe(user.id);
  });

  test('should create a new user', async () => {
    const walletAddress = '0x1234543266';
    const body: LoginWithFarcasterParams = {
      ...defaultBody,
      fid: Math.floor(Math.random() * 1000),
      username: '@test',
      verifications: [walletAddress]
    };

    expect(await loginWithFarcaster(body)).toHaveProperty('id');
  });
});
