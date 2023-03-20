import type { Space, SpaceRole } from '@prisma/client';
import { Wallet } from 'ethers';
import fetchMock from 'fetch-mock-jest';

import { prisma } from 'db';
import { DEEPDAO_BASE_URL } from 'lib/deepdao/client';
import { getAggregatedData } from 'lib/profile';
import type { LoggedInUser } from 'models';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user: LoggedInUser;
let space: Space & { spaceRoles: SpaceRole[] };

const walletAddresses = [Wallet.createRandom().address, Wallet.createRandom().address].map((a) => a.toLowerCase());

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken({ walletAddress: walletAddresses[0] }, false);
  user = generated.user;
  space = generated.space;

  await prisma.userWallet.create({
    data: {
      userId: user.id,
      address: walletAddresses[1]
    }
  });
});

afterAll(() => {
  fetchMock.restore();
});

describe('GET /api/public/profile/[userPath]', () => {
  it('Should combine several responses', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'complete',
      spaceId: space.id,
      userId: user.id
    });

    const proposal1 = {
      organizationId: '1',
      createdAt: new Date().toString(),
      title: undefined
    };
    const proposal2 = {
      organizationId: '1',
      createdAt: new Date().toString(),
      title: undefined
    };

    const vote1 = {
      organizationId: '1',
      createdAt: new Date().toString()
    };
    const vote2 = {
      organizationId: '1',
      createdAt: new Date().toString()
    };
    const vote3 = {
      organizationId: '2',
      createdAt: new Date().toString()
    };

    fetchMock
      .get(`${DEEPDAO_BASE_URL}/v0.1/people/profile/${walletAddresses[0]}`, {
        data: {
          totalProposals: 1,
          proposals: [proposal1, proposal2],
          totalVotes: 1,
          votes: [vote1, vote2],
          organizations: [{ organizationId: '1', name: 'organization 1' }]
        }
      })
      .get(`${DEEPDAO_BASE_URL}/v0.1/people/profile/${walletAddresses[1]}`, {
        data: {
          totalProposals: 2,
          proposals: [],
          totalVotes: 3,
          votes: [vote3],
          organizations: [{ organizationId: '2', name: 'organization 2' }]
        }
      })
      .get(`${DEEPDAO_BASE_URL}/v0.1/organizations`, {
        data: {
          resources: [],
          totalResources: 0
        }
      });

    const aggregatedData = await getAggregatedData(user.id, 'dummy_key');

    expect(fetchMock).toBeDone();

    expect(aggregatedData).toStrictEqual({
      bounties: 1,
      totalProposals: 3,
      totalVotes: 4,
      communities: [
        {
          id: '1',
          name: 'organization 1',
          isHidden: false,
          isPinned: false,
          logo: null,
          joinDate: proposal1.createdAt,
          votes: [vote1, vote2],
          proposals: [proposal1, proposal2],
          bounties: [],
          latestEventDate: vote2.createdAt
        },
        {
          id: '2',
          name: 'organization 2',
          isPinned: false,
          isHidden: false,
          logo: null,
          joinDate: vote3.createdAt,
          votes: [vote3],
          proposals: [],
          bounties: [],
          latestEventDate: vote3.createdAt
        },
        {
          id: space.id,
          joinDate: space.spaceRoles[0].createdAt.toISOString(),
          latestEventDate: bounty.createdAt.toISOString(),
          name: space.name,
          isPinned: false,
          isHidden: false,
          logo: null,
          votes: [],
          proposals: [],
          bounties: [
            {
              bountyId: bounty.id,
              createdAt: bounty.applications[0].createdAt.toISOString(),
              eventName: 'bounty_completed',
              organizationId: space.id,
              bountyPath: `/${space.domain}/${bounty.page?.path}`,
              bountyTitle: bounty.page?.title
            },
            {
              bountyId: bounty.id,
              createdAt: bounty.createdAt.toISOString(),
              eventName: 'bounty_created',
              organizationId: space.id,
              bountyPath: `/${space.domain}/${bounty.page?.path}`,
              bountyTitle: bounty.page?.title
            }
          ]
        }
      ]
    });
  });
});
