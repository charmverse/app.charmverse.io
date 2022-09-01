import { Space, SpaceRole } from '@prisma/client';
import { prisma } from 'db';
import nock from 'nock';
import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { LoggedInUser } from 'models';
import { v4 } from 'uuid';
import { DEEP_DAO_BASE_URL } from 'lib/deepdao/client';
import { getAggregatedData } from 'lib/profile';

nock.disableNetConnect();

let user: LoggedInUser;
let space: Space & { spaceRoles: SpaceRole[] };

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

    const bounty = await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'complete',
      spaceId: space.id,
      userId: user.id
    });

    const proposal1 = {
      organizationId: '1',
      createdAt: new Date().toString()
    }; const
      proposal2 = {
        organizationId: '1',
        createdAt: new Date().toString()
      };

    const vote1 = {
      organizationId: '1',
      createdAt: new Date().toString()
    }; const
      vote2 = {
        organizationId: '1',
        createdAt: new Date().toString()
      }; const
      vote3 = {
        organizationId: '2',
        createdAt: new Date().toString()
      };

    const profileScope = nock(DEEP_DAO_BASE_URL as string)
      .get(`/v0.1/people/profile/${walletAddresses[0]}`)
      .reply(200, {
        data: {
          totalProposals: 1,
          proposals: [proposal1, proposal2],
          totalVotes: 1,
          votes: [vote1, vote2],
          organizations: [{ organizationId: '1', name: 'organization 1' }]
        }
      })
      .get(`/v0.1/people/profile/${walletAddresses[1]}`)
      .reply(200, {
        data: {
          totalProposals: 2,
          proposals: [],
          totalVotes: 3,
          votes: [vote3],
          organizations: [{ organizationId: '2', name: 'organization 2' }]
        }
      })
      .get('/v0.1/organizations')
      .reply(200, {
        data: {
          resources: [],
          totalResources: 0
        }
      });

    const aggregatedData = await getAggregatedData(user.id, 'dummy_key');

    expect(profileScope.isDone());

    expect(aggregatedData).toStrictEqual({
      bounties: 1,
      totalProposals: 3,
      totalVotes: 4,
      communities: [{
        id: '1',
        name: 'organization 1',
        isHidden: false,
        logo: null,
        joinDate: proposal1.createdAt,
        votes: [vote1, vote2],
        proposals: [proposal1, proposal2],
        bounties: [],
        latestEventDate: vote2.createdAt
      }, {
        id: '2',
        name: 'organization 2',
        isHidden: false,
        logo: null,
        joinDate: vote3.createdAt,
        votes: [vote3],
        proposals: [],
        bounties: [],
        latestEventDate: vote3.createdAt
      }, {
        id: space.id,
        joinDate: space.spaceRoles[0].createdAt.toISOString(),
        latestEventDate: bounty.createdAt.toISOString(),
        name: space.name,
        isHidden: false,
        logo: null,
        votes: [],
        proposals: [],
        bounties: [{
          bountyId: bounty.id,
          createdAt: bounty.applications[0].createdAt.toISOString(),
          eventName: 'bounty_completed',
          organizationId: space.id,
          bountyTitle: bounty.page?.title
        }, {
          bountyId: bounty.id,
          createdAt: bounty.createdAt.toISOString(),
          eventName: 'bounty_created',
          organizationId: space.id,
          bountyTitle: bounty.page?.title
        }]
      }]
    });
  });
});
