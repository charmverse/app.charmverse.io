import type { ForumNotification } from 'lib/notifications/interfaces';

import type { ForumNotificationsContext, ForumNotifications } from './getForumTasks';
/**
 * Get all comments that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are direct replies after my comment
 */
export function getPostComments({ userId, spacesRecord, posts }: ForumNotificationsContext): ForumNotifications {
  const postsRecord = posts.reduce<Record<string, ForumNotificationsContext['posts'][number]>>((acc, post) => {
    acc[post.id] = post;
    return acc;
  }, {});
  const allComments = posts.flatMap((post) => post.comments);

  const commentIdsFromUser = allComments.filter((comment) => comment.createdBy === userId).map((comment) => comment.id);
  const commentsFromOthers = allComments.filter((comment) => comment.createdBy !== userId);

  // Comments that are not created by the user but are on a post page created by the user
  const commentsOnTheUserPage = posts
    .filter((post) => post.createdBy === userId)
    .flatMap((post) => post.comments)
    // only top-level comments
    .filter((comment) => comment.createdBy !== userId && !comment.parentId);

  const repliesToUserComments = commentsFromOthers.filter((comment) =>
    commentIdsFromUser.includes(comment.parentId ?? '')
  );

  const commentReplies = [
    ...commentsOnTheUserPage.map((c) => ({ ...c, reply: false })),
    ...repliesToUserComments.map((c) => ({ ...c, reply: true }))
  ];

  const commentTasks = commentReplies.map((comment) => {
    const commentNotification: ForumNotification = {
      commentId: comment.id,
      commentText: comment.contentText,
      createdAt: new Date(comment.createdAt).toISOString(),
      createdBy: comment.user,
      mentionId: null,
      postId: comment.postId,
      postPath: postsRecord[comment.postId].path,
      postTitle: postsRecord[comment.postId].title,
      spaceDomain: spacesRecord[postsRecord[comment.postId].spaceId].domain,
      spaceId: postsRecord[comment.postId].spaceId,
      spaceName: spacesRecord[postsRecord[comment.postId].spaceId].name,
      taskId: comment.id,
      type: comment.reply ? 'comment.replied' : 'comment.created'
    };
    return commentNotification;
  });

  return {
    mentions: [],
    comments: commentTasks
  };
}
