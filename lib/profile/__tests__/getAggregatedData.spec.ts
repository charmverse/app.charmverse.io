import type { Space, SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import fetchMock from 'fetch-mock-jest';

import { getAggregatedData } from 'lib/profile';
import { randomETHWalletAddress } from 'lib/utilities/blockchain';
import type { LoggedInUser } from 'models';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

const mockSandbox = fetchMock.sandbox();

let user: LoggedInUser;
let space: Space & { spaceRoles: SpaceRole[] };

const walletAddresses = [randomETHWalletAddress(), randomETHWalletAddress()].map((a) => a.toLowerCase());

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

    const aggregatedData = await getAggregatedData(user.id);

    expect(mockSandbox).toBeDone();

    expect(aggregatedData).toStrictEqual({
      bounties: 1,
      totalProposals: 0,
      totalVotes: 0,
      communities: [
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
          walletId: null,
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
