import { prisma } from '@charmverse/core/prisma-client';

import { createForumPost } from 'lib/forums/posts/createForumPost';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { emptyDocument } from 'lib/prosemirror/constants';
import { assignRole } from 'lib/roles';
import { createVote } from 'lib/votes';
import { getSpaceEntity, getVoteEntity } from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { createPage, generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';
import { createRole } from 'testing/utils/roles';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { createNotificationsFromEvent } from '../../createNotificationsFromEvent';
import { createPollNotifications } from '../createPollNotifications';

describe(`Test vote events and notifications`, () => {
  it(`Should create vote notifications for vote.created event`, async () => {
    // User 1 will create both the page and post
    // User 2 will be able to access the post since he has access to the post category
    // user 2 will not be able to access the page since he doesn't have access to the page category
    // the opposite is true for user 3

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

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: emptyDocument,
      contentText: 'Hello World',
      createdBy: user.id,
      isDraft: false,
      spaceId: space.id,
      title: 'Hello World'
    });

    const postModeratorRole = await createRole({
      spaceId: space.id,
      name: 'Post Moderator'
    });

    await premiumPermissionsApiClient.forum.upsertPostCategoryPermission({
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id,
      assignee: {
        group: 'role',
        id: postModeratorRole.id
      }
    });

    await assignRole({
      roleId: postModeratorRole.id,
      userId: user.id
    });

    await assignRole({
      roleId: postModeratorRole.id,
      userId: user2.id
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

    const postVote = await createVote({
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
      postId: post.id
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

    await createPollNotifications({
      event: {
        scope: WebhookEventNames.VoteCreated,
        space: await getSpaceEntity(space.id),
        vote: await getVoteEntity(postVote.id)
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

    const newPostVoteNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: postVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    const newPostUser3VoteNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: postVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user3.id
        }
      }
    });

    expect(newPageVoteNotification).toBeTruthy();
    expect(newPageUser2VoteNotification).toBeFalsy();
    expect(newPostVoteNotification).toBeTruthy();
    expect(newPostUser3VoteNotification).toBeFalsy();
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
