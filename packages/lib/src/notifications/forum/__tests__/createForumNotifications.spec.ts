import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';
import { createRole } from '@packages/testing/utils/roles';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { generateUser } from '@packages/testing/utils/users';
import { createForumPost } from '@packages/lib/forums/posts/createForumPost';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { assignRole } from '@packages/lib/roles';
import { getPostEntity, getSpaceEntity } from '@packages/lib/webhookPublisher/entities';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';

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

    const post = await createForumPost({
      categoryId: postCategory.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ text: 'Hello World ', type: 'text' }]
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

    await permissionsApiClient.forum.upsertPostCategoryPermission({
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

    expect(postCreatedNotification).toBeTruthy();
    expect(postCreatedUser3Notification).toBeFalsy();
  });
});
