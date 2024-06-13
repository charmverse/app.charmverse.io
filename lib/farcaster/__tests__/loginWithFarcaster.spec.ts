import { DataNotFoundError, DisabledAccountError, ExternalServiceError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-kit';

import { generateFarcasterUser, generateUserAndSpace } from 'testing/setupDatabase';

import { loginWithFarcaster } from '../loginWithFarcaster';

const defaultBody = {
  bio: 'biooo',
  displayName: 'My name',
  state: 'completed',
  nonce: '1235',
  url: 'https://example.com'
} as const;

describe('loginWithFarcaster', () => {
  afterEach(async () => {
    await prisma.userWallet.deleteMany({});
    await prisma.farcasterUser.deleteMany({});
  });

  test('should fail if no fid or no username in the body', async () => {
    const body = { ...defaultBody };

    await expect(loginWithFarcaster(body)).rejects.toThrowError(ExternalServiceError);
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

  test('should fail if wallet address associated with Farcaster has already an user account', async () => {
    const walletAddress = '0x1234';
    const body: StatusAPIResponse = {
      ...defaultBody,
      fid: Math.floor(Math.random() * 1000),
      username: '@test',
      verifications: [walletAddress]
    };

    await generateUserAndSpace({
      walletAddress
    });

    await expect(loginWithFarcaster(body)).rejects.toThrowError(DataNotFoundError);
  });

  test('should create a new user', async () => {
    const walletAddress = '0x1234543266';
    const body: StatusAPIResponse = {
      ...defaultBody,
      fid: Math.floor(Math.random() * 1000),
      username: '@test',
      verifications: [walletAddress]
    };

    expect(await loginWithFarcaster(body)).toHaveProperty('id');
  });
});
