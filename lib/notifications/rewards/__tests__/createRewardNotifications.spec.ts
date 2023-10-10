import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { approveApplication, createApplication, reviewSubmission, updateSubmission } from 'lib/applications/actions';
import { createBounty } from 'lib/bounties';
import { createUserFromWallet } from 'lib/users/createUser';
import { getApplicationEntity, getRewardEntity, getSpaceEntity, getUserEntity } from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { createNotificationsFromEvent } from '../../createNotificationsFromEvent';
import { createRewardNotifications } from '../createRewardNotifications';

describe(`Test reward events and notifications`, () => {
  it(`Should create bounty notifications for application.created event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      rewardToken: 'ETH',
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await createRewardNotifications({
      event: {
        scope: WebhookEventNames.RewardApplicationCreated,
        bounty: await getRewardEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationPendingReviewerNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.created',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(applicationPendingReviewerNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.accepted event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await approveApplication({
      applicationOrApplicationId: application.id,
      userId: user.id
    });

    await createRewardNotifications({
      event: {
        scope: WebhookEventNames.RewardApplicationApproved,
        bounty: await getRewardEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationAcceptedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.approved',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(applicationAcceptedNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.rejected event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await reviewSubmission({
      decision: 'reject',
      submissionId: application.id,
      userId: user.id
    });

    await createRewardNotifications({
      event: {
        scope: WebhookEventNames.RewardApplicationRejected,
        bounty: await getRewardEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id),
        user: await getUserEntity(user.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationRejectedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.rejected',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(applicationRejectedNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.submitted event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await approveApplication({
      applicationOrApplicationId: application.id,
      userId: user.id
    });

    await updateSubmission({
      customReward: false,
      submissionContent: {
        walletAddress: user2.wallets[0].address,
        submissionNodes: 'Hello World'
      },
      submissionId: application.id
    });

    await createRewardNotifications({
      event: {
        scope: WebhookEventNames.RewardSubmissionCreated,
        bounty: await getRewardEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationSubmittedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'submission.created',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(applicationSubmittedNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.approved event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const bountyReviewer = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: bountyReviewer.id
    });
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: bountyReviewer.id
          },
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await approveApplication({
      applicationOrApplicationId: application.id,
      userId: user.id
    });

    await updateSubmission({
      customReward: false,
      submissionContent: {
        walletAddress: user2.wallets[0].address,
        submissionNodes: 'Hello World'
      },
      submissionId: application.id
    });

    await reviewSubmission({
      decision: 'approve',
      submissionId: application.id,
      userId: user.id
    });

    await createRewardNotifications({
      event: {
        scope: WebhookEventNames.RewardSubmissionApproved,
        bounty: await getRewardEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id),
        user: await getUserEntity(user.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationApprovedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'submission.approved',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    const applicationPaymentPendingNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.payment_pending',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: bountyReviewer.id
        }
      }
    });

    expect(applicationApprovedNotification).toBeTruthy();
    expect(applicationPaymentPendingNotification).toBeTruthy();
  });

  it(`Should create bounty notifications for application.payment_completed event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await createUserFromWallet();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await approveApplication({
      applicationOrApplicationId: application.id,
      userId: user.id
    });

    await updateSubmission({
      customReward: false,
      submissionContent: {
        walletAddress: user2.wallets[0].address,
        submissionNodes: 'Hello World'
      },
      submissionId: application.id
    });

    await reviewSubmission({
      decision: 'approve',
      submissionId: application.id,
      userId: user.id
    });

    await createRewardNotifications({
      event: {
        scope: WebhookEventNames.RewardApplicationPaymentCompleted,
        bounty: await getRewardEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id),
        user: await getUserEntity(user.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const applicationPaymentCompletedNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.payment_completed',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(applicationPaymentCompletedNotification).toBeTruthy();
  });

  it(`Should not create notifications if they are disabled`, async () => {
    const { space, user } = await generateUserAndSpace({
      spaceNotificationToggles: {
        rewards: false
      }
    });
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      rewardToken: 'ETH',
      permissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await createApplication({
      bountyId: bounty.id,
      message: 'Hello World',
      userId: user2.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.RewardApplicationCreated,
        bounty: await getRewardEntity(bounty.id),
        space: await getSpaceEntity(space.id),
        application: await getApplicationEntity(application.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const notifications = await prisma.bountyNotification.findMany({
      where: {
        type: 'application.created',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(notifications).toHaveLength(0);
  });
});
