import { prisma } from '@charmverse/core/prisma-client';
import { Wallet } from 'ethers';
import fetchMock from 'fetch-mock-jest';
import { v4 } from 'uuid';

import { GAME7_BASE_URL } from 'lib/game7/client';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getGame7Profile } from '../getGame7Profile';

const mockSandbox = fetchMock.sandbox();

jest.mock('undici', () => {
  return { fetch: (...args: any[]) => mockSandbox(...args) };
});

afterAll(() => {
  fetchMock.restore();
});

const game7IdentityErrorResponse = {
  data: {
    userId: ''
  },
  message: '',
  status: 0
};

describe('getGame7Profile', () => {
  it(`Should return null if not user exist`, async () => {
    const game7Profile = await getGame7Profile({ userId: v4() });
    expect(game7Profile).toBeNull();
  });

  it(`Should return null if user doesn't have any game7 account connected with wallet address, email or discord account`, async () => {
    const walletAddress = Wallet.createRandom().address.toLowerCase();
    const emailAddress = `test-${v4()}@gmail.com`;
    const { user } = await generateUserAndSpaceWithApiToken({ walletAddress, email: emailAddress });
    const discordUsername = 'test';
    const discordDiscriminator = v4();
    await prisma.discordUser.create({
      data: {
        account: {
          username: discordUsername,
          discriminator: discordDiscriminator
        },
        userId: user.id,
        discordId: v4()
      }
    });

    mockSandbox
      .get(`${GAME7_BASE_URL}/v1/xps/scan/identity?walletAddress=${walletAddress}`, game7IdentityErrorResponse)
      .get(
        `${GAME7_BASE_URL}/v1/xps/scan/identity?discordHandle=${encodeURIComponent(
          `${discordUsername}#${discordDiscriminator}`
        )}`,
        game7IdentityErrorResponse
      )
      .get(
        `${GAME7_BASE_URL}/v1/xps/scan/identity?email=${encodeURIComponent(emailAddress)}`,
        game7IdentityErrorResponse
      );

    const game7Profile = await getGame7Profile({ userId: user.id });

    expect(game7Profile).toBeNull();
  });

  it(`Should return game7 profile attached with user's wallet address`, async () => {
    const walletAddress = Wallet.createRandom().address.toLowerCase();
    const { user } = await generateUserAndSpaceWithApiToken({ walletAddress });
    mockSandbox
      .get(`${GAME7_BASE_URL}/v1/xps/scan/identity?walletAddress=${walletAddress}`, {
        data: {
          userId: user.id
        },
        message: '',
        status: 0
      })
      .get(`${GAME7_BASE_URL}/v1/xps/scan/inventory/${user.id}`, {
        data: {
          user: user.id
        },
        message: '',
        status: 0
      });

    const game7Profile = await getGame7Profile({ userId: user.id });

    expect(game7Profile).toStrictEqual({
      user: user.id
    });
  });

  it(`Should return game7 profile attached with user's discord handle`, async () => {
    const discordUsername = `test`;
    const discordDiscriminator = v4();
    const walletAddress = Wallet.createRandom().address.toLowerCase();

    const { user } = await generateUserAndSpaceWithApiToken({ walletAddress });
    await prisma.discordUser.create({
      data: {
        account: {
          username: discordUsername,
          discriminator: discordDiscriminator
        },
        userId: user.id,
        discordId: v4()
      }
    });

    mockSandbox
      .get(`${GAME7_BASE_URL}/v1/xps/scan/identity?walletAddress=${walletAddress}`, game7IdentityErrorResponse)
      .get(
        `${GAME7_BASE_URL}/v1/xps/scan/identity?discordHandle=${encodeURIComponent(
          `${discordUsername}#${discordDiscriminator}`
        )}`,
        {
          data: {
            userId: user.id
          },
          message: '',
          status: 0
        }
      )
      .get(`${GAME7_BASE_URL}/v1/xps/scan/inventory/${user.id}`, {
        data: {
          user: user.id
        },
        message: '',
        status: 0
      });

    const game7Profile = await getGame7Profile({ userId: user.id });

    expect(game7Profile).toStrictEqual({
      user: user.id
    });
  });

  it(`Should return game7 profile attached with user's email address`, async () => {
    const discordUsername = `test`;
    const discordDiscriminator = v4();

    const emailAddress = `test-${v4()}@gmail.com`;
    const walletAddress = Wallet.createRandom().address.toLowerCase();
    const { user } = await generateUserAndSpaceWithApiToken({ walletAddress, email: emailAddress });
    await prisma.discordUser.create({
      data: {
        account: {
          username: discordUsername,
          discriminator: discordDiscriminator
        },
        userId: user.id,
        discordId: v4()
      }
    });

    mockSandbox
      .get(`${GAME7_BASE_URL}/v1/xps/scan/identity?walletAddress=${walletAddress}`, game7IdentityErrorResponse)
      .get(
        `${GAME7_BASE_URL}/v1/xps/scan/identity?discordHandle=${encodeURIComponent(
          `${discordUsername}#${discordDiscriminator}`
        )}`,
        game7IdentityErrorResponse
      )
      .get(`${GAME7_BASE_URL}/v1/xps/scan/identity?email=${encodeURIComponent(emailAddress)}`, {
        data: {
          userId: user.id
        },
        message: '',
        status: 0
      })
      .get(`${GAME7_BASE_URL}/v1/xps/scan/inventory/${user.id}`, {
        data: {
          user: user.id
        },
        message: '',
        status: 0
      });

    const game7Profile = await getGame7Profile({ userId: user.id });

    expect(game7Profile).toStrictEqual({
      user: user.id
    });
  });
});
