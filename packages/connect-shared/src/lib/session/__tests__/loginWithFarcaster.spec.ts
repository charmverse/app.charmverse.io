import { verifySignInMessage } from '@farcaster/auth-client';
import { DisabledAccountError, InvalidInputError } from '@packages/core/errors';
import { InvalidStateError } from '@packages/nextjs/errors';
import { generateFarcasterUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { vi } from 'vitest';

import type { LoginWithFarcasterParams } from '../loginWithFarcaster';
import { loginWithFarcaster } from '../loginWithFarcaster';

vi.mock('@farcaster/auth-client', () => ({
  verifySignInMessage: vi.fn().mockResolvedValue({ success: true }),
  viemConnector: vi.fn().mockReturnValue({ rpcUrls: ['http://localhost:8545'] }),
  createAppClient: vi.fn().mockReturnValue({})
}));

const mockedVerifySignInMessage = vi.mocked(verifySignInMessage);

const defaultBody = {
  bio: 'biooo',
  displayName: 'My name',
  state: 'completed',
  nonce: '1235',
  url: 'https://example.com',
  signature: '0x1234',
  message: 'message',
  signatureParams: {
    siweUri: '1234',
    domain: 'localhost:3000'
  },
  metadata: {
    ip: '1234',
    userAgent: '1234'
  }
} as LoginWithFarcasterParams;

describe('loginWithFarcaster', () => {
  test('should fail if the signature cannot be verified', async () => {
    mockedVerifySignInMessage.mockResolvedValueOnce({ success: false } as any);
    const body = { ...defaultBody, fid: Math.floor(Math.random() * 100000), username: '@test' };

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
    await generateFarcasterUser({
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
