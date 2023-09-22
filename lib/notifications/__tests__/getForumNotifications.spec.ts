import { v4 } from 'uuid';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { setForumCategoryNotification } from 'lib/userNotifications/setForumCategoryNotification';
import {
  createPost,
  generateForumComment,
  generateUserAndSpaceWithApiToken,
  generateSpaceUser
} from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { getForumNotifications } from '../getForumNotifications';

describe('getForumNotifications', () => {
  it('Should return new notifications from a user that replied directly to a comment', async () => {
    const postAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const postCommenter = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const postCommenter2 = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const newCategory = await generatePostCategory({ spaceId: postAuthorAndSpace.space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: postAuthorAndSpace.space.id },
      permissionLevel: 'full_access',
      postCategoryId: newCategory.id
    });
    const post = await createPost({
      spaceId: postAuthorAndSpace.space.id,
      createdBy: postAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] },
      categoryId: newCategory.id
    });

    const firstComment = await generateForumComment({
      postId: post.id,
      createdBy: postCommenter.id,
      parentId: v4(),
      contentText: 'First comment'
    });

    const secondComment = await generateForumComment({
      postId: post.id,
      createdBy: postCommenter2.id,
      parentId: firstComment.id,
      contentText: 'Second comment'
    });

    const { unmarked: newNotifications, marked: markedNotifications } = await getForumNotifications(postCommenter.id);

    // Second comment should have a parent and be a notification
    expect(
      newNotifications.find((notif) => notif.commentId === secondComment.id && notif.postId === post.id)
    ).toBeTruthy();
    expect(newNotifications.length).toBe(2);

    // First comment should not be part of marked/unmarked array because it's not the descendent of any comment
    expect(newNotifications.find((notif) => notif.commentId === firstComment.id)).toBeFalsy();
    expect(markedNotifications.length).toBe(0);
  });

  it('Should return new notifications to a page author when someone else comments', async () => {
    const postAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const postCommenter = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const postCommenter2 = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const newCategory = await generatePostCategory({ spaceId: postAuthorAndSpace.space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: postAuthorAndSpace.space.id },
      permissionLevel: 'full_access',
      postCategoryId: newCategory.id
    });
    const post = await createPost({
      spaceId: postAuthorAndSpace.space.id,
      createdBy: postAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] },
      categoryId: newCategory.id
    });

    const topLevelComment = await generateForumComment({
      postId: post.id,
      createdBy: postCommenter.id,
      parentId: null,
      contentText: 'First comment'
    });

    const secondComment = await generateForumComment({
      postId: post.id,
      createdBy: postCommenter2.id,
      parentId: topLevelComment.id,
      contentText: 'Second comment'
    });

    const { unmarked: newNotifications, marked: markedNotifications } = await getForumNotifications(
      postAuthorAndSpace.user.id
    );

    // Both comments should be unmarked
    expect(newNotifications.some((notif) => notif.commentId === topLevelComment.id && notif.postId === post.id)).toBe(
      true
    );
    expect(newNotifications.some((notif) => notif.commentId === secondComment.id && notif.postId === post.id)).toBe(
      false
    );

    expect(newNotifications.length).toBe(1);
    expect(markedNotifications.length).toBe(0);
  });

  it('Should return notification for a new post', async () => {
    const postAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const spaceUser = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const newCategory = await generatePostCategory({ spaceId: postAuthorAndSpace.space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: postAuthorAndSpace.space.id },
      permissionLevel: 'full_access',
      postCategoryId: newCategory.id
    });
    const post = await createPost({
      spaceId: postAuthorAndSpace.space.id,
      createdBy: postAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] },
      categoryId: newCategory.id
    });

    const { unmarked: newNotifications } = await getForumNotifications(spaceUser.id);

    expect(newNotifications.some((notif) => notif.taskId === post.id && notif.postId === post.id)).toBe(true);

    expect(newNotifications.length).toBe(1);
  });

  it('Should not return notification for a new post if user is not subscribed', async () => {
    const postAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const spaceUser = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const newCategory = await generatePostCategory({ spaceId: postAuthorAndSpace.space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: postAuthorAndSpace.space.id },
      permissionLevel: 'full_access',
      postCategoryId: newCategory.id
    });
    await setForumCategoryNotification({
      spaceId: postAuthorAndSpace.space.id,
      userId: spaceUser.id,
      categoryId: newCategory.id,
      enabled: false
    });
    await createPost({
      spaceId: postAuthorAndSpace.space.id,
      createdBy: postAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] },
      categoryId: newCategory.id
    });

    const { unmarked: newNotifications } = await getForumNotifications(spaceUser.id);

    expect(newNotifications.length).toBe(0);
  });

  it('Should not return notification for a post created before the user joined', async () => {
    const postAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const spaceUser = await generateSpaceUser({ spaceId: postAuthorAndSpace.space.id, isAdmin: false });
    const newCategory = await generatePostCategory({ spaceId: postAuthorAndSpace.space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: postAuthorAndSpace.space.id },
      permissionLevel: 'full_access',
      postCategoryId: newCategory.id
    });
    await createPost({
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      spaceId: postAuthorAndSpace.space.id,
      createdBy: postAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] },
      categoryId: newCategory.id
    });

    const { unmarked: newNotifications } = await getForumNotifications(spaceUser.id);

    expect(newNotifications.length).toBe(0);
  });
});
