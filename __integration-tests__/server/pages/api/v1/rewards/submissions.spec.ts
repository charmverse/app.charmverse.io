import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/testing/mockApiCall';
import {
  generateBountyWithSingleApplication,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from '@packages/testing/setupDatabase';
import request from 'supertest';

import { _ } from 'lib/prosemirror/builders';
import { getUserProfile } from 'lib/public-api/searchUserProfile';
import type { PublicApiSubmission } from 'pages/api/v1/rewards/submissions';

describe('GET /api/v1/rewards/submissions', () => {
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

    await prisma.$transaction([
      prisma.application.update({
        where: {
          id: bountyWithPaidApplication.applications[0].id
        },
        data: {
          submission: 'Submission',
          submissionNodes: JSON.stringify(_.doc(_.paragraph(_.bold('Submission'))).toJSON()),
          message: 'Application'
        }
      }),
      prisma.application.update({
        where: {
          id: bountyWithInProgressWork.applications[0].id
        },
        data: {
          message: 'Application'
        }
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
          application: {
            content: {
              text: 'Application'
            }
          },
          status: 'paid',
          id: bountyWithPaidApplication.applications[0].id,
          createdAt: expect.any(String),
          rewardId: bountyWithPaidApplication.id,
          submission: {
            content: {
              text: 'Submission',
              markdown: '**Submission**'
            }
          },
          credentials: [],
          author: getUserProfile(user)
        },
        {
          id: bountyWithInProgressWork.applications[0].id,
          createdAt: expect.any(String),
          rewardId: bountyWithInProgressWork.id,
          application: {
            content: {
              text: 'Application'
            }
          },
          credentials: [],
          author: getUserProfile(secondUser),
          status: 'submission_in_progress'
        }
      ])
    );
  });

  it('should return a list of submissions in the reward', async () => {
    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(undefined, false);
    const reviewerUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    const paidBountyDescription = 'This is a bounty description for a paid application';

    const bountyWithPaidApplication = await generateBountyWithSingleApplication({
      spaceId: space.id,
      applicationStatus: 'paid',
      bountyCap: 10,
      bountyStatus: 'open',
      userId: user.id,
      reviewer: reviewerUser.id,
      bountyDescription: paidBountyDescription,
      approveSubmitters: true
    });

    await prisma.$transaction([
      prisma.application.update({
        where: {
          id: bountyWithPaidApplication.applications[0].id
        },
        data: {
          submission: 'Submission',
          submissionNodes: JSON.stringify(_.doc(_.paragraph(_.bold('Submission'))).toJSON()),
          message: 'Application'
        }
      })
    ]);

    const response = (
      await request(baseUrl)
        .get(`/api/v1/rewards/submissions?api_key=${apiToken.token}&rewardId=${bountyWithPaidApplication.id}`)
        .send()
        .expect(200)
    ).body as PublicApiSubmission[];

    expect(response).toMatchObject(
      expect.arrayContaining([
        {
          application: {
            content: {
              text: 'Application'
            }
          },
          status: 'paid',
          id: bountyWithPaidApplication.applications[0].id,
          createdAt: expect.any(String),
          rewardId: bountyWithPaidApplication.id,
          submission: {
            content: {
              text: 'Submission',
              markdown: '**Submission**'
            }
          },
          credentials: [],
          author: getUserProfile(user)
        }
      ])
    );
  });
});
