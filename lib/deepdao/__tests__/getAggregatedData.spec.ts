import { Space, User } from '@prisma/client';
import { prisma } from 'db';
import nock from 'nock';
import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { DEEP_DAO_BASE_URL } from 'lib/deepdao/client';
import { getAggregatedData } from 'lib/deepdao/getAggregatedData';

nock.disableNetConnect();
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

afterAll(() => {
  nock.restore();
});

describe('GET /api/public/profile/[userPath]', () => {

  it('should throw a not found error if userPath doesn\'t return any user', async () => {
    try {
      await getAggregatedData(v4(), 'dummy_key');
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('Should combine several responses', async () => {

    await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'complete',
      spaceId: space.id,
      userId: user.id
    });

    const profileScope = nock(DEEP_DAO_BASE_URL as string)
      .get(`/v0.1/people/profile/${walletAddresses[0]}`)
      .reply(200, {
        data: {
          totalProposals: 1,
          proposals: ['proposal 1'],
          totalVotes: 1,
          votes: ['vote 1'],
          organizations: ['organization 1']
        }
      })
      .get(`/v0.1/people/profile/${walletAddresses[1]}`)
      .reply(200, {
        data: {
          totalProposals: 2,
          proposals: ['proposal 2'],
          totalVotes: 3,
          votes: ['vote 2'],
          organizations: ['organization 2']
        }
      });

    const aggregatedData = await getAggregatedData(user.id, 'dummy_key');

    expect(profileScope.isDone());

    expect(aggregatedData).toStrictEqual({
      bounties: 1,
      totalProposals: 3,
      totalVotes: 4,
      votes: ['vote 1', 'vote 2'],
      proposals: ['proposal 1', 'proposal 2'],
      organizations: ['organization 1', 'organization 2', {
        name: space.name,
        organizationId: space.id
      }]
    });
  });
});
