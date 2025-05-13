import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/testing/mockApiCall';
import {
  generateBountyWithSingleApplication,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 } from 'uuid';

import type { PublicApiReward } from 'pages/api/v1/rewards/index';

describe('GET /api/v1/rewards', () => {
  // This test needs to be fixed.
  it('should return a list of rewards in the workspace along with who has been paid for this bounty', async () => {
    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(undefined, false);

    const secondUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    const reviewerUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const paidBountyDescription = 'This is a bounty description for a paid application';
    const inProgressBountyDescription = 'This is a bounty description for an in progress application';

    const [bountyWithPaidApplication, bountyWithInProgressWork] = await Promise.all([
      generateBountyWithSingleApplication({
        spaceId: space.id,
        applicationStatus: 'paid',
        bountyCap: 10,
        bountyStatus: 'open',
        userId: user.id,
        reviewer: reviewerUser.id,
        bountyDescription: paidBountyDescription
      }),
      generateBountyWithSingleApplication({
        spaceId: space.id,
        applicationStatus: 'inProgress',
        bountyCap: 10,
        bountyStatus: 'open',
        userId: secondUser.id,
        reviewer: reviewerUser.id,
        bountyDescription: inProgressBountyDescription
      })
    ]);

    const response = (await request(baseUrl).get(`/api/v1/rewards?api_key=${apiToken.token}`).send().expect(200))
      .body as PublicApiReward[];

    // Both rewards should have been returned
    expect(response.length).toEqual(2);

    const bountyWithPaidFromApi = response.find((b) => b.id === bountyWithPaidApplication.id) as PublicApiReward;

    expect(bountyWithPaidFromApi).toEqual<PublicApiReward>(
      expect.objectContaining<PublicApiReward>({
        createdAt: bountyWithPaidApplication.createdAt.toISOString(),
        content: {
          text: paidBountyDescription,
          markdown: paidBountyDescription
        },
        id: bountyWithPaidApplication.id,
        issuer: {
          address: user.wallets[0].address
        },
        recipients: [
          {
            address: user.wallets[0].address
          }
        ],
        reward: {
          amount: bountyWithPaidApplication.rewardAmount,
          chain: bountyWithPaidApplication.chainId,
          token: bountyWithPaidApplication.rewardToken,
          custom: null
        },
        title: bountyWithPaidApplication.page.title,
        status: bountyWithPaidApplication.status,
        url: `${baseUrl}/${space.domain}/${bountyWithPaidApplication.id}`
      })
    );

    const bountyWithInProgressFromApi = response.find((b) => b.id === bountyWithInProgressWork.id) as PublicApiReward;

    expect(bountyWithInProgressFromApi).toEqual<PublicApiReward>(
      expect.objectContaining<PublicApiReward>({
        createdAt: bountyWithInProgressWork.createdAt.toISOString(),
        content: {
          markdown: inProgressBountyDescription,
          text: inProgressBountyDescription
        },
        id: bountyWithInProgressWork.id,
        issuer: {
          address: secondUser.wallets[0].address
        },
        // Empty recipients list
        recipients: [],
        reward: {
          amount: bountyWithInProgressWork.rewardAmount,
          chain: bountyWithInProgressWork.chainId,
          token: bountyWithInProgressWork.rewardToken,
          custom: null
        },
        title: bountyWithInProgressWork.page.title,
        status: bountyWithInProgressWork.status,
        url: `${baseUrl}/${space.domain}/${bountyWithInProgressWork.id}`
      })
    );
  });

  it('should ignore rewards whose page has been soft deleted', async () => {
    const { space: space2, user: space2User } = await generateUserAndSpace();

    const space2SuperApiToken = await prisma.superApiToken.create({
      data: {
        name: `Test super API key for space ${space2.id}`,
        token: v4(),
        spaces: { connect: { id: space2.id } }
      }
    });

    const bountyCreateInput: Prisma.BountyCreateInput = {
      author: { connect: { id: space2User.id } },
      chainId: 1,
      rewardAmount: 10,
      rewardToken: 'DAI',
      status: 'open',
      space: { connect: { id: space2.id } },
      page: {
        create: {
          // This is the important part
          deletedAt: new Date(),
          title: 'Bounty marked as deleted',
          author: { connect: { id: space2User.id } },
          space: { connect: { id: space2.id } },
          path: `bounty-${v4()}`,
          type: 'bounty',
          updatedBy: space2User.id,
          contentText: 'Bounty content'
        }
      }
    };

    await prisma.bounty.create({
      data: bountyCreateInput
    });

    const response = (
      await request(baseUrl)
        .get(`/api/v1/rewards?spaceId=${space2.id}`)
        .set({ authorization: `Bearer ${space2SuperApiToken.token}` })
        .send()
        .expect(200)
    ).body as PublicApiReward[];

    // No data should be returned
    expect(response.length).toEqual(0);
  });
});
