import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { createForumPost } from 'lib/forums/posts/createForumPost';
import { permissionsApiClient } from 'lib/permissions/api/routers';
import { emptyDocument } from 'lib/prosemirror/constants';
import { assignRole } from 'lib/roles';
import { createVote } from 'lib/votes';
import { getSpaceEntity, getVoteEntity } from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { createPage, generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';
import { createRole } from 'testing/utils/roles';

import { createNotificationsFromEvent } from '../../createNotificationsFromEvent';
import { createPollNotifications } from '../createPollNotifications';

describe(`Test vote events and notifications`, () => {
  it(`Should create vote notifications for vote.created event in a page`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    // Doesn't have access to post category
    const user3 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
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

    const newPageVoteUserNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: pageVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const newPageVoteUser3Notification = await prisma.voteNotification.findFirst({
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

    expect(newPageVoteUserNotification).toBeFalsy();
    expect(newPageVoteUser3Notification).toBeTruthy();
    expect(newPageUser2VoteNotification).toBeFalsy();
  });

  it(`Should create vote notifications for vote.created event in a post`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    // Doesn't have access to post category
    const user3 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
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

    await permissionsApiClient.forum.upsertPostCategoryPermission({
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
        vote: await getVoteEntity(postVote.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
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

    expect(newPostVoteNotification).toBeTruthy();
    expect(newPostUser3VoteNotification).toBeFalsy();
  });

  it('Should not trigger notifications when they are disabled', async () => {
    const { space, user } = await generateUserAndSpace({
      spaceNotificationToggles: {
        polls: false
      }
    });
    const user2 = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
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
