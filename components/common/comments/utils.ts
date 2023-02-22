import type { CommentSortType } from 'components/common/comments/CommentSort';
import type { GenericCommentWithVote, GenericComment, CommentWithChildren } from 'lib/comments';

export function processComments<T>(postComments: GenericComment<T>[]): CommentWithChildren<T>[] {
  // Get top level comments
  const topLevelComments: CommentWithChildren<T>[] = [];

  // Create the map
  const postCommentsRecord: Record<string, CommentWithChildren<T>> = {};
  postComments.forEach((postComment) => {
    postCommentsRecord[postComment.id] = {
      ...postComment,
      children: []
    };
  });

  // Push child-level comments into their parents
  postComments.forEach((postComment) => {
    if (postComment.parentId) {
      postCommentsRecord[postComment.parentId].children.push(postCommentsRecord[postComment.id]);
    }
  });
  Object.values(postCommentsRecord).forEach((comment) => {
    comment.children = comment.children.sort((c1, c2) => (c1.createdAt < c2.createdAt ? 1 : -1));
    if (!comment.parentId) {
      topLevelComments.push(comment);
    }
  });

  return topLevelComments;
}
export function sortComments<T>({
  comments,
  sort
}: {
  comments: GenericCommentWithVote<T>[];
  sort: CommentSortType;
}): GenericCommentWithVote<T>[] {
  if (sort === 'latest') {
    return comments.sort((c1, c2) => (c1.createdAt > c2.createdAt ? -1 : 1));
  } else if (sort === 'top') {
    return comments.sort((c1, c2) => (c1.upvotes - c1.downvotes > c2.upvotes - c2.downvotes ? -1 : 1));
  }

  return comments;
}
