import { v4 } from 'uuid';

import {
  createPage,
  generateForumComment,
  generateUserAndSpaceWithApiToken,
  generateSpaceUser
} from 'testing/setupDatabase';

import { getForumCommentsTasks } from '../getForumTasks';

describe('getForumCommentsTasks', () => {
  it('Should return new notifications from a user that replied directly to a comment', async () => {
    const pageAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const pageCommenter = await generateSpaceUser({ spaceId: pageAuthorAndSpace.space.id, isAdmin: false });
    const pageCommenter2 = await generateSpaceUser({ spaceId: pageAuthorAndSpace.space.id, isAdmin: false });
    const page = await createPage({
      spaceId: pageAuthorAndSpace.space.id,
      createdBy: pageAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] }
    });

    const firstComment = await generateForumComment({
      pageId: page.id,
      createdBy: pageCommenter.id,
      parentId: v4(),
      contentText: 'First comment'
    });

    const secondComment = await generateForumComment({
      pageId: page.id,
      createdBy: pageCommenter2.id,
      parentId: firstComment.id,
      contentText: 'Second comment'
    });

    const { unmarked: newNotifications, marked: markedNotifications } = await getForumCommentsTasks(pageCommenter.id);

    // Second comment should have a parent and be a notification
    expect(
      newNotifications.find((notif) => notif.commentId === secondComment.id && notif.pageId === page.id)
    ).toBeTruthy();
    expect(newNotifications.length === 1).toBeTruthy();

    // First comment should not be part of marked/unmarked array because it's not the descendent of any comment
    expect(newNotifications.find((notif) => notif.commentId === firstComment.id)).toBeFalsy();
    expect(markedNotifications.length === 0).toBeTruthy();
  });

  it('Should return new notifications to a page author when someone else comments', async () => {
    const pageAuthorAndSpace = await generateUserAndSpaceWithApiToken();
    const pageCommenter = await generateSpaceUser({ spaceId: pageAuthorAndSpace.space.id, isAdmin: false });
    const pageCommenter2 = await generateSpaceUser({ spaceId: pageAuthorAndSpace.space.id, isAdmin: false });
    const page = await createPage({
      spaceId: pageAuthorAndSpace.space.id,
      createdBy: pageAuthorAndSpace.user.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', value: 'New value' }] }] }
    });

    const firstComment = await generateForumComment({
      pageId: page.id,
      createdBy: pageCommenter.id,
      parentId: v4(),
      contentText: 'First comment'
    });

    const secondComment = await generateForumComment({
      pageId: page.id,
      createdBy: pageCommenter2.id,
      parentId: firstComment.id,
      contentText: 'Second comment'
    });

    const { unmarked: newNotifications, marked: markedNotifications } = await getForumCommentsTasks(
      pageAuthorAndSpace.user.id
    );

    // Both comments should be unmarked
    expect(
      newNotifications.find((notif) => notif.commentId === firstComment.id && notif.pageId === page.id)
    ).toBeTruthy();
    expect(
      newNotifications.find((notif) => notif.commentId === secondComment.id && notif.pageId === page.id)
    ).toBeTruthy();

    expect(newNotifications.length === 2).toBeTruthy();
    expect(markedNotifications.length === 0).toBeTruthy();
  });
});
