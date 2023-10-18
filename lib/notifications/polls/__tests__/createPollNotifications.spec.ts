import { prisma } from '@charmverse/core/prisma-client';

import { emptyDocument } from 'lib/prosemirror/constants';
import { createVote } from 'lib/votes';
import { getSpaceEntity, getVoteEntity } from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { createPage, generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { createNotificationsFromEvent } from '../../createNotificationsFromEvent';
import { createPollNotifications } from '../createPollNotifications';

describe(`Test vote events and notifications`, () => {
  it(`Should create vote notifications for vote.created event`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    // Doesn't have access to post category
    const user3 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user3.id
    });

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          userId: user3.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    const pageVote = await createVote({
      content: emptyDocument,
      contentText: '',
      context: 'inline',
      createdBy: user.id,
      deadline: new Date(),
      maxChoices: 3,
      spaceId: space.id,
      threshold: 2,
      title: 'Vote',
      type: 'Approval',
      voteOptions: [],
      pageId: page.id
    });

    await createPollNotifications({
      event: {
        scope: WebhookEventNames.VoteCreated,
        space: await getSpaceEntity(space.id),
        vote: await getVoteEntity(pageVote.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const newPageVoteNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: pageVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user3.id
        }
      }
    });

    const newPageUser2VoteNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: pageVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(newPageVoteNotification).toBeTruthy();
    expect(newPageUser2VoteNotification).toBeFalsy();
  });

  it('Should not trigger notifications when they are disabled', async () => {
    const { space, user } = await generateUserAndSpace({
      spaceNotificationToggles: {
        polls: false
      }
    });
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          userId: user2.id,
          permissionLevel: 'full_access'
        }
      ]
    });

    const pageVote = await createVote({
      content: emptyDocument,
      contentText: '',
      context: 'inline',
      createdBy: user.id,
      deadline: new Date(),
      maxChoices: 3,
      spaceId: space.id,
      threshold: 2,
      title: 'Vote',
      type: 'Approval',
      voteOptions: [],
      pageId: page.id
    });

    await createNotificationsFromEvent({
      event: {
        scope: WebhookEventNames.VoteCreated,
        space: await getSpaceEntity(space.id),
        vote: await getVoteEntity(pageVote.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const notifications = await prisma.voteNotification.findMany({
      where: {
        notificationMetadata: {
          spaceId: space.id
        }
      }
    });

    expect(notifications).toHaveLength(0);
  });
});
