import type { ApplicationStatus, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBounty } from '@packages/testing/setupDatabase';
import { WrongStateError } from '@packages/utils/errors';

import type { Reward } from '../interfaces';
import { reviewApplication } from '../reviewApplication';

describe('reviewApplication', () => {
  let user: User;
  let reviewerUser: User;
  let space: Space;
  let reward: Reward;

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace());
    reviewerUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });
  });
  it('should update application status to inProgress when current status is applied and decision is approve', async () => {
    const application = await prisma.application.create({
      data: {
        applicant: { connect: { id: user.id } },
        bounty: { connect: { id: reward.id } },
        spaceId: space.id,
        status: 'applied',
        message: 'Sample application message'
      }
    });
    const reviewedApp = await reviewApplication({
      applicationId: application.id,
      decision: 'approve',
      userId: reviewerUser.id
    });
    expect(reviewedApp.status).toBe('inProgress');
    expect(reviewedApp.acceptedBy).toBe(reviewerUser.id);
  });

  it('should update application status to complete when current status is in progress or review and decision is approve', async () => {
    const applicationInProgress = await prisma.application.create({
      data: {
        applicant: { connect: { id: user.id } },
        bounty: { connect: { id: reward.id } },
        spaceId: space.id,
        status: 'inProgress',
        message: 'Sample application message'
      }
    });

    const applicationInReview = await prisma.application.create({
      data: {
        applicant: { connect: { id: user.id } },
        bounty: { connect: { id: reward.id } },
        spaceId: space.id,
        status: 'review',
        message: 'Sample application message'
      }
    });

    const reviewedApp = await reviewApplication({
      applicationId: applicationInProgress.id,
      decision: 'approve',
      userId: reviewerUser.id
    });

    const reviewedApp2 = await reviewApplication({
      applicationId: applicationInReview.id,
      decision: 'approve',
      userId: reviewerUser.id
    });

    expect(reviewedApp.status).toBe('complete');
    expect(reviewedApp.reviewedBy).toBe(reviewerUser.id);

    expect(reviewedApp2.status).toBe('complete');
    expect(reviewedApp2.reviewedBy).toBe(reviewerUser.id);
  });

  it('should update application status to rejected and submission status to submission_rejected when decision is reject', async () => {
    const applicationInProgress = await prisma.application.create({
      data: {
        applicant: { connect: { id: user.id } },
        bounty: { connect: { id: reward.id } },
        spaceId: space.id,
        status: 'inProgress',
        message: 'Sample application message'
      }
    });

    const applicationPending = await prisma.application.create({
      data: {
        applicant: { connect: { id: user.id } },
        bounty: { connect: { id: reward.id } },
        spaceId: space.id,
        status: 'applied',
        message: 'Sample application message'
      }
    });

    const reviewedSubmission = await reviewApplication({
      applicationId: applicationInProgress.id,
      decision: 'reject',
      userId: user.id
    });
    const reviewedApplication = await reviewApplication({
      applicationId: applicationPending.id,
      decision: 'reject',
      userId: user.id
    });
    expect(reviewedSubmission.status).toBe('submission_rejected');
    expect(reviewedSubmission.reviewedBy).toBe(user.id);

    expect(reviewedApplication.status).toBe('rejected');
    expect(reviewedApplication.reviewedBy).toBe(user.id);
  });

  it('should throw WrongStateError when the application is not in a reviewable status', async () => {
    const nonReviewableStatuses: ApplicationStatus[] = ['cancelled', 'rejected', 'processing', 'complete', 'paid'];
    // First set the status to a non-reviewable status
    for (const status of nonReviewableStatuses) {
      const application = await prisma.application.create({
        data: {
          applicant: { connect: { id: user.id } },
          bounty: { connect: { id: reward.id } },
          spaceId: space.id,
          status,
          message: 'Sample application message'
        }
      });
      await expect(
        reviewApplication({ applicationId: application.id, decision: 'approve', userId: user.id })
      ).rejects.toThrow(WrongStateError);
    }
  });
});
