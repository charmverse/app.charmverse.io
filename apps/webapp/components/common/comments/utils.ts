import type { CommentSortType } from 'components/common/comments/CommentSort';
import type {
  GenericCommentWithVote,
  CommentWithChildren,
  GenericCommentVote,
  GenericComment
} from '@packages/lib/comments';

export function processComments<T>({
  comments,
  sort
}: {
  comments: GenericCommentWithVote<T>[];
  sort: CommentSortType;
}): CommentWithChildren<T>[] {
  // Get top level comments
  const topLevelComments: CommentWithChildren<T>[] = [];

  // Create the map
  const commentsMap = new Map<string, CommentWithChildren<T>>();
  comments.forEach((comment) => {
    commentsMap.set(comment.id, {
      ...comment,
      children: []
    });
  });

  // Push child-level comments into their parents
  comments.forEach((comment) => {
    if (comment.parentId) {
      const commentRecord = commentsMap.get(comment.id);
      if (commentRecord) {
        commentsMap.get(comment.parentId)?.children.push(commentRecord);
      }
    }
  });
  [...commentsMap.values()].forEach((comment) => {
    comment.children = sortComments({ comments: comment.children, sort });
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
  comments: GenericCommentWithVote<T>[] | GenericComment<T>[];
  sort: CommentSortType;
}): GenericCommentWithVote<T>[] | GenericComment<T>[] {
  if (sort === 'latest') {
    return comments.sort((c1, c2) => (c1.createdAt > c2.createdAt ? -1 : 1));
  } else if (sort === 'top') {
    return (comments as GenericCommentWithVote<T>[]).sort((c1, c2) =>
      c1.upvotes - c1.downvotes > c2.upvotes - c2.downvotes ? -1 : 1
    );
  }

  return comments;
}

export function getUpdatedCommentVote(comment: GenericCommentVote, newUpvotedStatus: boolean | null) {
  const voteStatus: GenericCommentVote = {
    downvotes: comment.downvotes,
    upvotes: comment.upvotes,
    upvoted: newUpvotedStatus
  };

  if (newUpvotedStatus === true) {
    voteStatus.upvotes += 1;
    if (comment.upvoted === false) {
      voteStatus.downvotes -= 1;
    }
  } else if (newUpvotedStatus === false) {
    voteStatus.downvotes += 1;
    if (comment.upvoted === true) {
      voteStatus.upvotes -= 1;
    }
  } else if (comment.upvoted === true) {
    voteStatus.upvotes -= 1;
  } else {
    voteStatus.downvotes -= 1;
  }

  return voteStatus;
}
