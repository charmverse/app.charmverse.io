import request from 'supertest';

import { getUserProfile } from 'lib/public-api/searchUserProfile';
import { prettyPrint } from 'lib/utils/strings';
import type { PublicApiSubmission } from 'pages/api/v1/rewards/submissions';
import { baseUrl } from 'testing/mockApiCall';
import {
  generateUserAndSpaceWithApiToken,
  generateBountyWithSingleApplication,
  generateSpaceUser
} from 'testing/setupDatabase';

describe('GET /api/v1/submissions', () => {
  it('should return a list of submissions in the workspace', async () => {
    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(undefined, false);
    const reviewerUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    const paidBountyDescription = 'This is a bounty description for a paid application';
    const inProgressBountyDescription = 'This is a bounty description for an in progress application';
    const secondUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const [bountyWithPaidApplication, bountyWithInProgressWork] = await Promise.all([
      generateBountyWithSingleApplication({
        spaceId: space.id,
        applicationStatus: 'paid',
        bountyCap: 10,
        bountyStatus: 'open',
        userId: user.id,
        reviewer: reviewerUser.id,
        bountyDescription: paidBountyDescription,
        approveSubmitters: true
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

    const response = (
      await request(baseUrl)
        .get(`/api/v1/rewards/submissions?api_key=${apiToken.token}&spaceId=${space.id}`)
        .send()
        .expect(200)
    ).body as PublicApiSubmission[];

    expect(response).toMatchObject(
      expect.arrayContaining([
        {
          application: null,
          submission: {
            id: bountyWithPaidApplication.applications[0].id,
            createdAt: expect.any(String),
            rewardId: bountyWithPaidApplication.id
          },
          credentials: [],
          author: getUserProfile(user)
        },
        {
          submission: null,
          application: {
            id: bountyWithInProgressWork.applications[0].id,
            createdAt: expect.any(String),
            rewardId: bountyWithInProgressWork.id
          },
          credentials: [],
          author: getUserProfile(secondUser)
        }
      ])
    );
  });

  it('should return an error if both spaceId and rewardId are missing', async () => {
    const { apiToken } = await generateUserAndSpaceWithApiToken(undefined, false);
    const response = await request(baseUrl).get(`/api/v1/rewards/submissions?api_key=${apiToken.token}`).send();

    // An error should be returned
    expect(response.status).toEqual(400);
  });
});
