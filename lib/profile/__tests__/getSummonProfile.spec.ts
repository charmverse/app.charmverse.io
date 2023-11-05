import { prisma } from '@charmverse/core/prisma-client';
import fetchMock from 'fetch-mock-jest';
import { v4 } from 'uuid';

import { SUMMON_BASE_URL } from 'lib/summon/api';
import { randomETHWalletAddress } from 'lib/utilities/blockchain';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getSummonProfile } from '../getSummonProfile';

const mockSandbox = fetchMock.sandbox();

jest.mock('undici', () => {
  return { fetch: (...args: any[]) => mockSandbox(...args) };
});

afterAll(() => {
  fetchMock.restore();
});

const summonIdentityErrorResponse = {
  data: {
    userId: ''
  },
  message: '',
  status: 0
};

describe('getSummonProfile', () => {
  it(`Should return null if not user exist`, async () => {
    const summonProfile = await getSummonProfile({ userId: v4() });
    expect(summonProfile).toBeNull();
  });

  it(`Should return null if user doesn't have any summon account connected with wallet address, email or discord account`, async () => {
    const walletAddress = randomETHWalletAddress().toLowerCase();
    const emailAddress = `test-${v4()}@gmail.com`;
    const { user } = await generateUserAndSpaceWithApiToken({ walletAddress });

    await prisma.googleAccount.create({
      data: {
        avatarUrl: '',
        email: emailAddress,
        userId: user.id,
        name: 'test'
      }
    });

    const discordUsername = 'test';
    await prisma.discordUser.create({
      data: {
        account: {
          username: discordUsername
        },
        userId: user.id,
        discordId: v4()
      }
    });

    mockSandbox
      .get(`${SUMMON_BASE_URL}/scan/identity?walletAddress=${walletAddress}`, summonIdentityErrorResponse)
      .get(
        `${SUMMON_BASE_URL}/scan/identity?discordHandle=${encodeURIComponent(`${discordUsername}`)}`,
        summonIdentityErrorResponse
      )
      .get(`${SUMMON_BASE_URL}/scan/identity?email=${encodeURIComponent(emailAddress)}`, summonIdentityErrorResponse);

    const summonProfile = await getSummonProfile({ userId: user.id });

    expect(summonProfile).toBeNull();
  });

  it(`Should return summon profile attached with user's wallet address`, async () => {
    const walletAddress = randomETHWalletAddress().toLowerCase();
    const { user } = await generateUserAndSpaceWithApiToken({ walletAddress });
    mockSandbox
      .get(`${SUMMON_BASE_URL}/scan/identity?walletAddress=${walletAddress}`, {
        data: {
          userId: user.id
        },
        message: '',
        status: 0
      })
      .get(`${SUMMON_BASE_URL}/scan/inventory/${user.id}`, {
        data: {
          user: user.id
        },
        message: '',
        status: 0
      });

    const summonProfile = await getSummonProfile({ userId: user.id });

    expect(summonProfile).toStrictEqual({
      id: user.id,
      meta: undefined,
      tenantId: undefined
    });
  });

  it(`Should return summon profile attached with user's discord handle`, async () => {
    const discordUsername = `test123`;
    const walletAddress = randomETHWalletAddress().toLowerCase();

    const { user } = await generateUserAndSpaceWithApiToken({ walletAddress });
    await prisma.discordUser.create({
      data: {
        account: {
          username: discordUsername
        },
        userId: user.id,
        discordId: v4()
      }
    });

    mockSandbox
      .get(`${SUMMON_BASE_URL}/scan/identity?walletAddress=${walletAddress}`, summonIdentityErrorResponse)
      .get(`${SUMMON_BASE_URL}/scan/identity?discordHandle=${encodeURIComponent(`${discordUsername}`)}`, {
        data: {
          userId: user.id
        },
        message: '',
        status: 0
      })
      .get(`${SUMMON_BASE_URL}/scan/inventory/${user.id}`, {
        data: {
          user: user.id
        },
        message: '',
        status: 0
      });

    const summonProfile = await getSummonProfile({ userId: user.id });

    expect(summonProfile).toStrictEqual({
      id: user.id,
      meta: undefined,
      tenantId: undefined
    });
  });

  it(`Should return summon profile attached with user's email address`, async () => {
    const discordUsername = `test`;
    const discordDiscriminator = v4();
    const emailAddress = `test-${v4()}@gmail.com`;
    const walletAddress = randomETHWalletAddress().toLowerCase();
    const { user } = await generateUserAndSpaceWithApiToken({ walletAddress });

    await prisma.googleAccount.create({
      data: {
        avatarUrl: '',
        email: emailAddress,
        userId: user.id,
        name: 'test'
      }
    });

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
      .get(`${SUMMON_BASE_URL}/scan/identity?walletAddress=${walletAddress}`, summonIdentityErrorResponse)
      .get(
        `${SUMMON_BASE_URL}/scan/identity?discordHandle=${encodeURIComponent(
          `${discordUsername}#${discordDiscriminator}`
        )}`,
        summonIdentityErrorResponse
      )
      .get(`${SUMMON_BASE_URL}/scan/identity?email=${encodeURIComponent(emailAddress)}`, {
        data: {
          userId: user.id
        },
        message: '',
        status: 0
      })
      .get(`${SUMMON_BASE_URL}/scan/inventory/${user.id}`, {
        data: {
          user: user.id
        },
        message: '',
        status: 0
      });

    const summonProfile = await getSummonProfile({ userId: user.id });

    expect(summonProfile).toStrictEqual({
      id: user.id,
      meta: undefined,
      tenantId: undefined
    });
  });
});
