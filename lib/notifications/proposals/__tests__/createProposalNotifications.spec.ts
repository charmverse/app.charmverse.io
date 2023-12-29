import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';

import { createProposal } from 'lib/proposal/createProposal';
import { updateProposalStatus } from 'lib/proposal/updateProposalStatus';
import { assignRole } from 'lib/roles';
import { getProposalEntity, getSpaceEntity, getUserEntity } from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { createRole } from 'testing/utils/roles';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { createNotificationsFromEvent } from '../../createNotificationsFromEvent';
import { createProposalNotifications } from '../createProposalNotifications';

describe(`Test proposal events and notifications`, () => {
  it(`Should create proposal notifications for proposal.status_changed event`, async () => {
    const { space } = await generateUserAndSpace();
    const author1 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: author1.id
    });
    const author2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: author2.id
    });
    const reviewer = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: reviewer.id
    });

    const member1 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: member1.id
    });

    // Member 2 doesn't have any access to proposal category, so notifications shouldn't be created for them
    const member2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: member2.id
    });

    const role = await createRole({
      spaceId: space.id,
      name: 'Post Moderators'
    });

    await Promise.all(
      [author1.id, author2.id, reviewer.id, member1.id].map((userId) =>
        assignRole({
          roleId: role.id,
          userId
        })
      )
    );

    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'role', id: role.id }
        }
      ]
    });

    const { proposal } = await createProposal({
      isDraft: true,
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: author1.id,
      authors: [author1.id, author2.id],
      reviewers: [
        {
          group: 'user',
          id: author1.id
        },
        {
          group: 'user',
          id: reviewer.id
        }
      ]
    });

    const spaceEntity = await getSpaceEntity(space.id);
    const proposalEntity = await getProposalEntity(proposal.id);

    // Move to discussion status

    await updateProposalStatus({
      newStatus: 'discussion',
      proposalId: proposal.id,
      userId: author1.id
    });

    await createProposalNotifications({
      event: {
        scope: WebhookEventNames.ProposalStatusChanged,
        proposal: proposalEntity,
        newStatus: 'discussion',
        oldStatus: 'draft',
        space: spaceEntity,
        user: await getUserEntity(author1.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalDiscussionStatusChangedAuthorNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'start_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: author2.id,
          spaceId: space.id
        }
      }
    });

    const proposalDiscussionStatusChangedReviewerNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'start_discussion',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: reviewer.id,
          spaceId: space.id
        }
      }
    });

    const proposalDiscussionStatusChangedMember1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'start_discussion',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member1.id,
          spaceId: space.id
        }
      }
    });

    const proposalDiscussionStatusChangedMember2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'start_discussion',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member2.id,
          spaceId: space.id
        }
      }
    });

    expect(proposalDiscussionStatusChangedAuthorNotification).toBeTruthy();
    expect(proposalDiscussionStatusChangedReviewerNotification).toBeTruthy();
    expect(proposalDiscussionStatusChangedMember1Notification).toBeTruthy();
    expect(proposalDiscussionStatusChangedMember2Notification).toBeTruthy();

    // Move to review status

    await updateProposalStatus({
      newStatus: 'review',
      proposalId: proposal.id,
      userId: author1.id
    });

    await createProposalNotifications({
      event: {
        scope: WebhookEventNames.ProposalStatusChanged,
        proposal: proposalEntity,
        newStatus: 'review',
        oldStatus: 'discussion',
        space: spaceEntity,
        user: await getUserEntity(author1.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalReviewStatusChangedAuthorNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'needs_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: author2.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewStatusChangedReviewerNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'needs_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: reviewer.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewStatusChangedMember1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'needs_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member1.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewStatusChangedMember2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'needs_review',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member2.id,
          spaceId: space.id
        }
      }
    });

    expect(proposalReviewStatusChangedAuthorNotification).toBeFalsy();
    expect(proposalReviewStatusChangedReviewerNotification).toBeTruthy();
    expect(proposalReviewStatusChangedMember1Notification).toBeFalsy();
    expect(proposalReviewStatusChangedMember2Notification).toBeFalsy();

    // Move to reviewed status
    await updateProposalStatus({
      newStatus: 'reviewed',
      proposalId: proposal.id,
      userId: reviewer.id
    });

    await createProposalNotifications({
      event: {
        scope: WebhookEventNames.ProposalStatusChanged,
        proposal: proposalEntity,
        newStatus: 'reviewed',
        oldStatus: 'review',
        space: spaceEntity,
        user: await getUserEntity(author1.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalReviewedStatusChangedAuthorNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'reviewed',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: author2.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewedStatusChangedReviewerNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'reviewed',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: reviewer.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewedStatusChangedMember1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'reviewed',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member1.id,
          spaceId: space.id
        }
      }
    });

    const proposalReviewedStatusChangedMember2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'reviewed',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member2.id,
          spaceId: space.id
        }
      }
    });

    expect(proposalReviewedStatusChangedAuthorNotification).toBeTruthy();
    expect(proposalReviewedStatusChangedReviewerNotification).toBeFalsy();
    expect(proposalReviewedStatusChangedMember1Notification).toBeFalsy();
    expect(proposalReviewedStatusChangedMember2Notification).toBeFalsy();

    // Move to vote_active status

    await updateProposalStatus({
      newStatus: 'vote_active',
      proposalId: proposal.id,
      userId: author1.id
    });

    await createProposalNotifications({
      event: {
        scope: WebhookEventNames.ProposalStatusChanged,
        proposal: proposalEntity,
        newStatus: 'vote_active',
        oldStatus: 'reviewed',
        space: spaceEntity,
        user: await getUserEntity(author1.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const proposalVoteActiveStatusChangedAuthorNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'vote',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: author2.id,
          spaceId: space.id
        }
      }
    });

    const proposalVoteActiveStatusChangedReviewerNotification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'vote',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: reviewer.id,
          spaceId: space.id
        }
      }
    });

    const proposalVoteActiveStatusChangedMember1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'vote',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member1.id,
          spaceId: space.id
        }
      }
    });

    const proposalVoteActiveStatusChangedMember2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'vote',
        proposalId: proposal.id,
        notificationMetadata: {
          userId: member2.id,
          spaceId: space.id
        }
      }
    });

    expect(proposalVoteActiveStatusChangedAuthorNotification).toBeTruthy();
    expect(proposalVoteActiveStatusChangedReviewerNotification).toBeTruthy();
    expect(proposalVoteActiveStatusChangedMember1Notification).toBeTruthy();
    expect(proposalVoteActiveStatusChangedMember2Notification).toBeTruthy();
  });

  it('Should not create notifications when they are disabled', async () => {
    const { space } = await createDiscussionNotifications({
      spaceNotificationToggles: {
        proposals: false
      }
    });
    const notifications = await prisma.proposalNotification.findMany({
      where: {
        notificationMetadata: {
          spaceId: space.id
        }
      }
    });
    expect(notifications).toHaveLength(0);
  });

  it('Should not create new notifications when they are disabled', async () => {
    const { space } = await createDiscussionNotifications({
      spaceNotificationToggles: {
        proposals__start_discussion: false
      }
    });
    const notifications = await prisma.proposalNotification.findMany({
      where: {
        notificationMetadata: {
          spaceId: space.id
        }
      }
    });
    expect(notifications).toHaveLength(0);
  });
});

async function createDiscussionNotifications(input: Parameters<typeof generateUserAndSpace>[0]) {
  const { space } = await generateUserAndSpace(input);
  const author1 = await generateUser();
  await addUserToSpace({
    spaceId: space.id,
    userId: author1.id
  });
  const reviewer = await generateUser();
  await addUserToSpace({
    spaceId: space.id,
    userId: reviewer.id
  });

  const role = await createRole({
    spaceId: space.id,
    name: 'Post Moderators'
  });

  const proposalCategory = await testUtilsProposals.generateProposalCategory({
    spaceId: space.id,
    proposalCategoryPermissions: [
      {
        permissionLevel: 'full_access',
        assignee: { group: 'role', id: role.id }
      }
    ]
  });

  await Promise.all(
    [author1.id, reviewer.id].map((userId) =>
      assignRole({
        roleId: role.id,
        userId
      })
    )
  );

  const { proposal } = await createProposal({
    categoryId: proposalCategory.id,
    spaceId: space.id,
    userId: author1.id,
    authors: [author1.id],
    isDraft: true,
    reviewers: [
      {
        group: 'user',
        id: reviewer.id
      }
    ]
  });

  const spaceEntity = await getSpaceEntity(space.id);
  const proposalEntity = await getProposalEntity(proposal.id);

  // Move to discussion status

  await updateProposalStatus({
    newStatus: 'discussion',
    proposalId: proposal.id,
    userId: author1.id
  });

  await createNotificationsFromEvent({
    event: {
      scope: WebhookEventNames.ProposalStatusChanged,
      proposal: proposalEntity,
      newStatus: 'discussion',
      oldStatus: 'draft',
      space: spaceEntity,
      user: await getUserEntity(author1.id)
    },
    spaceId: space.id,
    createdAt: new Date().toISOString()
  });
  return { space };
}
