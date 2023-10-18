import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createForumPost } from 'lib/forums/posts/createForumPost';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { emptyDocument } from 'lib/prosemirror/constants';
import { assignRole } from 'lib/roles';
import { getPostEntity, getSpaceEntity } from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';
import { createRole } from 'testing/utils/roles';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { createForumNotifications } from '../createForumNotifications';

describe(`Test forum events and notifications`, () => {
  it(`Should create post notifications for forum.post.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
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

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const mentionId = v4();
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
      voteOptions: []
    });

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { text: 'Hello World ', type: 'text' },
              {
                type: 'mention',
                attrs: {
                  id: mentionId,
                  type: 'user',
                  value: user2.id,
                  createdAt: new Date().toISOString(),
                  createdBy: user.id
                }
              }
            ]
          },
          {
            type: 'poll',
            attrs: {
              pollId: postVote.id
            }
          }
        ]
      },
      contentText: 'Hello World',
      createdBy: user.id,
      isDraft: false,
      spaceId: space.id,
      title: 'Hello World'
    });

    const role = await createRole({
      spaceId: space.id,
      name: 'Post Moderator'
    });

    await premiumPermissionsApiClient.forum.upsertPostCategoryPermission({
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id,
      assignee: {
        group: 'role',
        id: role.id
      }
    });

    await assignRole({
      roleId: role.id,
      userId: user.id
    });

    await assignRole({
      roleId: role.id,
      userId: user2.id
    });

    await createForumNotifications({
      event: {
        scope: WebhookEventNames.ForumPostCreated,
        post: await getPostEntity(post.id),
        space: await getSpaceEntity(space.id)
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const postCreatedNotification = await prisma.postNotification.findFirst({
      where: {
        type: 'created',
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    // Since user3 doesn't have access to the post category, they shouldn't get a notification
    const postCreatedUser3Notification = await prisma.postNotification.findFirst({
      where: {
        type: 'created',
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user3.id
        }
      }
    });

    const postMentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'mention.created',
        mentionId,
        postId: post.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    const pollCreatedNotification = await prisma.voteNotification.findFirst({
      where: {
        type: 'new_vote',
        voteId: postVote.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user2.id
        }
      }
    });

    expect(postCreatedNotification).toBeTruthy();
    expect(postCreatedUser3Notification).toBeFalsy();
    expect(postMentionCreatedNotification).toBeTruthy();
    expect(pollCreatedNotification).toBeTruthy();
  });
});
