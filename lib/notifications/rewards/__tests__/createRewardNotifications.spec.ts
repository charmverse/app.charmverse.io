import { prisma } from '@charmverse/core/prisma-client';
import { createUserWithWallet, generateUserAndSpace, generateBounty } from '@packages/testing/setupDatabase';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { generateUser } from '@packages/testing/utils/users';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { reviewApplication } from '@root/lib/rewards/reviewApplication';
import { work } from '@root/lib/rewards/work';
import {
  getApplicationEntity,
  getRewardEntity,
  getSpaceEntity,
  getUserEntity
} from '@root/lib/webhookPublisher/entities';
import { WebhookEventNames } from '@root/lib/webhookPublisher/interfaces';

import { createNotificationsFromEvent } from '../../createNotificationsFromEvent';
import { createRewardNotifications } from '../createRewardNotifications';

describe(`Test reward events and notifications`, () => {
  it(`Should create reward notifications for reward creator and reviewers application.created event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        reviewer: [
          {
            group: 'user',
            id: user2.id
          }
        ]
      }
    });

    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: user.id,
        bountyId: bounty.id
      }
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
          userId: user2.id
        }
      }
    });

    const applicationPendingCreatorNotification = await prisma.bountyNotification.findFirst({
      where: {
        type: 'application.created',
        applicationId: application.id,
        bountyId: bounty.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(applicationPendingReviewerNotification).toBeTruthy();
    expect(applicationPendingCreatorNotification).toBeTruthy();
  });

  it(`Should create reward notifications for application.accepted event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: user2.id,
        bountyId: bounty.id
      }
    });

    await reviewApplication({
      applicationId: application.id,
      userId: user.id,
      decision: 'approve'
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

  it(`Should create reward notifications for application.rejected event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: user2.id,
        bountyId: bounty.id
      }
    });

    await reviewApplication({
      decision: 'reject',
      applicationId: application.id,
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

  it(`Should create reward notifications for application.submitted event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await createUserWithWallet({
      address: randomETHWalletAddress()
    });
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      bountyPermissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: user2.id,
        bountyId: bounty.id
      }
    });

    await reviewApplication({
      applicationId: application.id,
      userId: user.id,
      decision: 'approve'
    });

    await work({
      rewardInfo: '',
      walletAddress: user2.wallets[0].address,
      submissionNodes: 'Hello World',
      rewardId: bounty.id,
      applicationId: application.id,
      userId: user2.id
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

  it(`Should create reward notifications for application.approved event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const bountyReviewer = await createUserWithWallet({
      address: randomETHWalletAddress()
    });
    await addUserToSpace({
      spaceId: space.id,
      userId: bountyReviewer.id
    });
    const user2 = await createUserWithWallet({
      address: randomETHWalletAddress()
    });
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      bountyPermissions: {
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

    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: user2.id,
        bountyId: bounty.id
      }
    });

    await reviewApplication({
      applicationId: application.id,
      userId: user.id,
      decision: 'approve'
    });

    await work({
      walletAddress: user2.wallets[0].address,
      submissionNodes: 'Hello World',
      applicationId: application.id,
      rewardId: bounty.id,
      userId: user2.id
    });

    await reviewApplication({
      applicationId: application.id,
      userId: user.id,
      decision: 'approve'
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

  it(`Should create reward notifications for application.payment_completed event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await createUserWithWallet({
      address: randomETHWalletAddress()
    });
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      bountyPermissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: user2.id,
        bountyId: bounty.id
      }
    });
    await reviewApplication({
      applicationId: application.id,
      userId: user.id,
      decision: 'approve'
    });

    await work({
      walletAddress: user2.wallets[0].address,
      submissionNodes: 'Hello World',
      applicationId: application.id,
      rewardId: bounty.id,
      userId: user2.id
    });

    await reviewApplication({
      decision: 'approve',
      applicationId: application.id,
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

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        reviewer: [
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    });

    const application = await prisma.application.create({
      data: {
        spaceId: space.id,
        createdBy: user2.id,
        bountyId: bounty.id
      }
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
