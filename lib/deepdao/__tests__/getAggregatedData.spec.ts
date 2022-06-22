import { Space, User } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import fetch from 'node-fetch';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';

jest.mock('node-fetch');

let user: User;
let space: Space;

const walletAddresses = [v4(), v4()];

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(walletAddresses[0], false);
  user = generated.user;
  space = generated.space;

  await prisma.user.update({
    where: {
      id: user.id
    },
    // Update wallet address so we can get cumulative results
    data: {
      addresses: walletAddresses
    }
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /api/public/profile/[userPath]', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  it('should throw a not found error if userPath doesn\'t return any user', async () => {
    const { getAggregatedData } = await import('../getAggregatedData');
    try {
      await getAggregatedData(v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('Should return aggregate data', async () => {
    const { getAggregatedData } = await import('../getAggregatedData');

    await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'complete',
      spaceId: space.id,
      userId: user.id
    });

    const json = jest.fn();

    mockFetch.mockResolvedValue({
      json
      // Its not possible to complete mock node-fetch so using any
    } as any);

    json.mockResolvedValueOnce({
      data: {
        daos: 4,
        proposals: 12,
        votes: 9
      }
    });

    json.mockResolvedValueOnce({
      data: {
        daos: 6,
        proposals: 8,
        votes: 6
      }
    });

    const aggregatedData = await getAggregatedData(user.id);

    expect(aggregatedData).toStrictEqual({
      daos: 11,
      proposals: 20,
      votes: 15,
      bounties: 1
    });
  });
});
