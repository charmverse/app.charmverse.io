import type { CommentSortType } from 'components/common/comments/CommentSort';

type CommentVote = {
  upvotes: number;
  downvotes: number;
  upvoted: null | boolean;
};

type CommentToProcess = {
  id: string;
  parentId: string | null;
  createdAt: Date;
} & CommentVote;

export type CommentWithChildren<T> = T &
  CommentToProcess & {
    children: CommentWithChildren<T>[];
  };

export function processComments<T extends CommentToProcess>(postComments: T[]): (T & CommentWithChildren<T>)[] {
  // Get top level comments
  const topLevelComments: (T & CommentWithChildren<T>)[] = [];

  // Create the map
  const postCommentsRecord: Record<string, T & CommentWithChildren<T>> = {};
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

type CommentToSort = {
  createdAt: Date;
  downvotes: number;
  upvotes: number;
};

export function sortComments<T extends CommentToSort>({
  comments,
  sort
}: {
  comments: T[];
  sort: CommentSortType;
}): T[] {
  if (sort === 'latest') {
    return comments.sort((c1, c2) => (c1.createdAt > c2.createdAt ? -1 : 1));
  } else if (sort === 'top') {
    return comments.sort((c1, c2) => (c1.upvotes - c1.downvotes > c2.upvotes - c2.downvotes ? -1 : 1));
  }

  return comments;
}
