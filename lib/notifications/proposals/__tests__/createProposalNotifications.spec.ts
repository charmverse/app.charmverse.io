import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createRole } from '@packages/testing/utils/roles';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { generateUser } from '@packages/testing/utils/users';
import { assignRole } from '@root/lib/roles';
import { getProposalEntity, getSpaceEntity, getUserEntity } from '@root/lib/webhookPublisher/entities';
import { WebhookEventNames } from '@root/lib/webhookPublisher/interfaces';
import { v4 } from 'uuid';

import { createNotificationsFromEvent } from '../../createNotificationsFromEvent';

describe(`Test proposal events and notifications`, () => {
  it('Should not create notifications when they are disabled', async () => {
    const { space } = await createProposalStatusChangeNotification({
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
    const { space } = await createProposalStatusChangeNotification({
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

async function createProposalStatusChangeNotification(input: Parameters<typeof generateUserAndSpace>[0]) {
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
  await Promise.all(
    [author1.id, reviewer.id].map((userId) =>
      assignRole({
        roleId: role.id,
        userId
      })
    )
  );
  const proposalEvaluationId = v4();
  const proposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: author1.id,
    authors: [author1.id],
    proposalStatus: 'published',
    evaluationInputs: [
      {
        id: proposalEvaluationId,
        reviewers: [],
        evaluationType: 'feedback',
        title: 'Feedback',
        rubricCriteria: [],
        permissions: [
          {
            operation: 'comment',
            assignee: {
              group: 'space_member'
            }
          }
        ]
      }
    ]
  });

  const spaceEntity = await getSpaceEntity(space.id);
  const proposalEntity = await getProposalEntity(proposal.id);
  await createNotificationsFromEvent({
    event: {
      scope: WebhookEventNames.ProposalStatusChanged,
      proposal: proposalEntity,
      currentEvaluationId: proposalEvaluationId,
      space: spaceEntity,
      user: await getUserEntity(author1.id)
    },
    spaceId: space.id,
    createdAt: new Date().toISOString()
  });
  return { space };
}
