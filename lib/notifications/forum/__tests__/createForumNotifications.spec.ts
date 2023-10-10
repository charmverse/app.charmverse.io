import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createPostComment } from 'lib/forums/comments/createPostComment';
import { createForumPost } from 'lib/forums/posts/createForumPost';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { emptyDocument } from 'lib/prosemirror/constants';
import { assignRole } from 'lib/roles';
import { getCommentEntity, getPostEntity, getSpaceEntity } from 'lib/webhookPublisher/entities';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
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

    expect(postCreatedNotification).toBeTruthy();
    expect(postCreatedUser3Notification).toBeFalsy();
    expect(postMentionCreatedNotification).toBeTruthy();
  });

  it(`Should create post notifications for forum.comment.created event`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const user2 = await generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: user2.id
    });

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const mentionId = v4();

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: {
        type: 'doc',
        content: emptyDocument
      },
      contentText: 'Hello World',
      createdBy: user.id,
      isDraft: false,
      spaceId: space.id,
      title: 'Hello World'
    });

    const postComment1 = await createPostComment({
      content: emptyDocument,
      contentText: 'Hello World',
      postId: post.id,
      userId: user.id
    });

    const postComment1Reply = await createPostComment({
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
                  value: user.id,
                  createdAt: new Date().toISOString(),
                  createdBy: user2.id
                }
              }
            ]
          }
        ]
      },
      contentText: 'Hello World',
      postId: post.id,
      userId: user2.id,
      parentId: postComment1.id
    });

    const postComment2 = await createPostComment({
      content: emptyDocument,
      contentText: 'Hello World',
      postId: post.id,
      userId: user2.id
    });

    const postEntity = await getPostEntity(post.id);
    const spaceEntity = await getSpaceEntity(space.id);

    await createForumNotifications({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(postComment1.id, true),
        post: postEntity,
        space: spaceEntity,
        document: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createForumNotifications({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(postComment1Reply.id, true),
        post: postEntity,
        space: spaceEntity,
        document: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    await createForumNotifications({
      event: {
        scope: WebhookEventNames.DocumentCommentCreated,
        comment: await getCommentEntity(postComment2.id, true),
        post: postEntity,
        space: spaceEntity,
        document: null
      },
      spaceId: space.id,
      createdAt: new Date().toISOString()
    });

    const postCommentCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.created',
        postId: post.id,
        postCommentId: postComment2.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const postCommentRepliedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.replied',
        postId: post.id,
        postCommentId: postComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    const commentMentionCreatedNotification = await prisma.documentNotification.findFirst({
      where: {
        type: 'comment.mention.created',
        postId: post.id,
        mentionId,
        postCommentId: postComment1Reply.id,
        notificationMetadata: {
          spaceId: space.id,
          userId: user.id
        }
      }
    });

    expect(postCommentCreatedNotification).toBeTruthy();
    expect(postCommentRepliedNotification).toBeTruthy();
    expect(commentMentionCreatedNotification).toBeTruthy();
  });
});
