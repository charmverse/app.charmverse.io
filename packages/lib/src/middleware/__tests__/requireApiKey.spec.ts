import { SubscriptionRequiredError } from '@charmverse/core/errors';
import type { Space, SpaceApiToken, SuperApiToken, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { InvalidApiKeyError } from '@packages/nextjs/errors';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import type { NextApiRequest } from 'next';
import { v4 } from 'uuid';

import { provisionApiKey, requireApiKey } from '../requireApiKey';

let user: User;
let space: Space;
let botUser: User;
let normalApiKey: SpaceApiToken;
let superApiKey: SuperApiToken;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;

  normalApiKey = await provisionApiKey(space.id);

  botUser = (await prisma.user.findFirst({
    where: {
      isBot: true,
      spaceRoles: {
        some: {
          spaceId: space.id
        }
      }
    }
  })) as User;

  superApiKey = await prisma.superApiToken.create({
    data: {
      token: v4(),
      name: `Test super API key-${v4()}`,
      spaces: {
        connect: {
          id: space.id
        }
      }
    },
    include: {
      spaces: true
    }
  });
});

describe('requireApiKey', () => {
  it('should identify the space linked to a normal API key when using bearer auth', async () => {
    const testReq: NextApiRequest = {
      headers: {
        authorization: `Bearer ${normalApiKey.token}`
      }
    } as any;

    const mockedNext = jest.fn();

    await requireApiKey(testReq, {} as any, mockedNext);

    expect(testReq.authorizedSpaceId).toBe(normalApiKey.spaceId);
    expect(testReq.spaceIdRange).not.toBeDefined();
    expect(mockedNext).toBeCalledTimes(1);
  });

  it('should set the bot user linked to the API key on the request object', async () => {
    const testReq: NextApiRequest = {
      headers: {
        authorization: `Bearer ${normalApiKey.token}`
      }
    } as any;

    const mockedNext = jest.fn();

    await requireApiKey(testReq, {} as any, mockedNext);

    expect(testReq.authorizedSpaceId).toBe(normalApiKey.spaceId);
    expect(testReq.spaceIdRange).not.toBeDefined();
    expect(testReq.botUser.id).toBeDefined();
    expect(mockedNext).toBeCalledTimes(1);
  });
  it('should identify the space linked to a normal API key when using query parameter auth', async () => {
    const testReq: NextApiRequest = {
      query: {
        api_key: `${normalApiKey.token}`
      }
    } as any;

    const mockedNext = jest.fn();

    await requireApiKey(testReq, {} as any, mockedNext);

    expect(testReq.authorizedSpaceId).toBe(normalApiKey.spaceId);
    expect(testReq.spaceIdRange).not.toBeDefined();
    expect(mockedNext).toBeCalledTimes(1);
  });

  it('should identify the space requested a super API key when using bearer auth', async () => {
    const testReq: NextApiRequest = {
      query: {
        spaceId: space.id
      },
      headers: {
        authorization: `Bearer ${superApiKey.token}`
      }
    } as any;

    const mockedNext = jest.fn();

    await requireApiKey(testReq, {} as any, mockedNext);

    expect(testReq.authorizedSpaceId).toBe(space.id);
    expect(testReq.spaceIdRange).toEqual([space.id]);
    expect(mockedNext).toBeCalledTimes(1);
  });

  it('should identify the space requested by a super API key when using query parameter auth', async () => {
    const testReq: NextApiRequest = {
      query: {
        spaceId: space.id,
        api_key: superApiKey.token
      }
    } as any;

    const mockedNext = jest.fn();

    await requireApiKey(testReq, {} as any, mockedNext);

    expect(testReq.authorizedSpaceId).toBe(space.id);
    expect(testReq.spaceIdRange).toEqual([space.id]);
    expect(mockedNext).toBeCalledTimes(1);
  });

  it('should throw an error if trying to perform an action against a space not linked to a super API key', async () => {
    const spaceWithoutKey = await prisma.space.create({
      data: {
        domain: `space-without-key-${v4()}`,
        name: 'Space without key',
        updatedBy: user.id,
        author: { connect: { id: user.id } }
      }
    });

    const testReq: NextApiRequest = {
      query: {
        spaceId: spaceWithoutKey.id,
        api_key: superApiKey.token
      }
    } as any;

    const mockedNext = jest.fn();
    await expect(requireApiKey(testReq, {} as any, mockedNext)).rejects.toBeInstanceOf(InvalidApiKeyError);
    expect(mockedNext).not.toBeCalled();
  });

  it('should not throw an error if the space is a free space, but the request is made with a partner API Key', async () => {
    const { space: freeSpace } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });
    const partnerApiKey = await prisma.superApiToken.create({
      data: {
        token: v4(),
        name: `Partner API key - ${v4()}`,
        spaces: {
          connect: {
            id: freeSpace.id
          }
        }
      }
    });
    const testReq: NextApiRequest = {
      headers: {
        authorization: `Bearer ${partnerApiKey.token}`
      },
      query: {
        spaceId: freeSpace.id
      }
    } as any;

    const mockedNext = jest.fn();
    await requireApiKey(testReq, {} as any, mockedNext);

    // Simulate calling Next.js next() handler when a middleware call succeeds
    expect(mockedNext).toBeCalled();
  });

  it('should throw an error if the space is a free space', async () => {
    const { space: freeSpace } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });
    const freeSpaceApiKey = await prisma.spaceApiToken.create({
      data: {
        token: v4(),
        space: { connect: { id: freeSpace.id } }
      }
    });
    const testReq: NextApiRequest = {
      headers: {
        authorization: `Bearer ${freeSpaceApiKey.token}`
      }
    } as any;

    const mockedNext = jest.fn();

    await expect(requireApiKey(testReq, {} as any, mockedNext)).rejects.toBeInstanceOf(SubscriptionRequiredError);
  });

  it('should throw an error if no api key or an invalid API key is provided', async () => {
    const testReq: NextApiRequest = {
      query: {
        api_key: v4()
      }
    } as any;

    const mockedNext = jest.fn();
    await expect(requireApiKey(testReq, {} as any, mockedNext)).rejects.toBeInstanceOf(InvalidApiKeyError);
    await expect(requireApiKey({} as any, {} as any, mockedNext)).rejects.toBeInstanceOf(InvalidApiKeyError);
  });
});
