import request from 'supertest';

import type { PublicApiBounty } from 'pages/api/v1/bounties/index';
import { baseUrl } from 'testing/mockApiCall';
import { generateBountyWithSingleApplication, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('GET /api/v1/bounties', () => {
  // This test needs to be fixed.
  it.skip('should return a list of bounties in the workspace along with who has been paid for this bounty', async () => {

    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(undefined, false);

    const secondUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    const reviewerUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const [bountyWithPaidApplication, bountyWithInProgressWork] = await Promise.all([
      generateBountyWithSingleApplication({
        spaceId: space.id,
        applicationStatus: 'paid',
        bountyCap: 10,
        bountyStatus: 'open',
        userId: user.id,
        reviewer: reviewerUser.id
      }),
      generateBountyWithSingleApplication({
        spaceId: space.id,
        applicationStatus: 'inProgress',
        bountyCap: 10,
        bountyStatus: 'open',
        userId: secondUser.id,
        reviewer: reviewerUser.id
      })
    ]);

    const response = (await request(baseUrl)
      .get(`/api/v1/bounties?api_key=${apiToken.token}`)
      .send()
      .expect(200)
    ).body as PublicApiBounty[];

    // Both bounties should have been returned
    expect(response.length).toEqual(2);

    const bountyWithPaidFromApi = response.find(b => b.id === bountyWithPaidApplication.id) as PublicApiBounty;

    expect(bountyWithPaidFromApi).toEqual<PublicApiBounty>(
      expect.objectContaining<PublicApiBounty>({
        createdAt: bountyWithPaidApplication.createdAt.toISOString(),
        description: (bountyWithPaidApplication as unknown as PublicApiBounty).description,
        id: bountyWithPaidApplication.id,
        issuer: {
          address: user.wallets[0].address
        },
        recipients: [{
          address: user.wallets[0].address
        }],
        reward: {
          amount: bountyWithPaidApplication.rewardAmount,
          chain: bountyWithPaidApplication.chainId,
          token: bountyWithPaidApplication.rewardToken
        },
        title: (bountyWithPaidApplication as unknown as PublicApiBounty).title,
        status: bountyWithPaidApplication.status,
        url: `${baseUrl}/${space.domain}/bounties/${bountyWithPaidApplication.id}`
      })
    );

    const bountyWithInProgressFromApi = response.find(b => b.id === bountyWithInProgressWork.id) as PublicApiBounty;

    expect(bountyWithInProgressFromApi).toEqual<PublicApiBounty>(
      expect.objectContaining<PublicApiBounty>({
        createdAt: bountyWithInProgressWork.createdAt.toISOString(),
        description: (bountyWithInProgressWork as unknown as PublicApiBounty).description,
        id: bountyWithInProgressWork.id,
        issuer: {
          address: secondUser.wallets[0].address
        },
        // Empty recipients list
        recipients: [],
        reward: {
          amount: bountyWithInProgressWork.rewardAmount,
          chain: bountyWithInProgressWork.chainId,
          token: bountyWithInProgressWork.rewardToken
        },
        title: (bountyWithInProgressWork as unknown as PublicApiBounty).title,
        status: bountyWithInProgressWork.status,
        url: `${baseUrl}/${space.domain}/bounties/${bountyWithInProgressWork.id}`
      })
    );

  });
});
