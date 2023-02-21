import type { ForumNotificationsInput, ForumNotifications } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';
/**
 * Get all comments that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are direct replies after my comment
 */
export function getPostComments({ userId, spacesRecord, posts }: ForumNotificationsInput): ForumNotifications {
  const postsRecord = posts.reduce<Record<string, ForumNotificationsInput['posts'][number]>>((acc, post) => {
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

  const commentReplies = [...commentsOnTheUserPage, ...repliesToUserComments];

  const commentTasks = commentReplies.map((comment) => {
    return {
      ...getPropertiesFromPost(postsRecord[comment.postId], spacesRecord[postsRecord[comment.postId].spaceId]),
      createdAt: new Date(comment.createdAt).toISOString(),
      userId: comment.createdBy,
      commentText: comment.contentText,
      commentId: comment.id,
      mentionId: null
    };
  });

  return {
    mentions: [],
    discussionUserIds: commentTasks.map((comm) => comm.userId).concat([userId]),
    comments: commentTasks
  };
}
