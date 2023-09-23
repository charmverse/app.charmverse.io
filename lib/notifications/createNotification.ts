import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type {
  BountyNotificationType,
  DiscussionNotificationType,
  ForumNotificationType,
  ProposalNotificationType,
  VoteNotificationType
} from './interfaces';

type CreatePostNotificationInput = {
  createdBy: string;
  postId: string;
  spaceId: string;
  userId: string;
  commentId?: string;
  mentionId?: string;
  type: ForumNotificationType;
} & (
  | {
      type: 'post.created';
    }
  | {
      type: 'post.comment.created';
      commentId: string;
    }
  | {
      type: 'post.comment.replied';
      commentId: string;
    }
  | {
      type: 'post.mention.created';
      mentionId: string;
    }
  | {
      type: 'post.comment.mention.created';
      mentionId: string;
      commentId: string;
    }
);

export async function createPostNotification({
  createdBy,
  commentId,
  mentionId,
  postId,
  spaceId,
  userId,
  type
}: CreatePostNotificationInput) {
  const notificationId = v4();
  await prisma.postNotification.create({
    data: {
      type,
      id: notificationId,
      mentionId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      comment: commentId
        ? {
            connect: {
              id: commentId
            }
          }
        : undefined,
      post: {
        connect: {
          id: postId
        }
      }
    }
  });
}

type CreatePageNotificationInput = {
  createdBy: string;
  pageId: string;
  spaceId: string;
  userId: string;
  commentId?: string;
  mentionId?: string;
  inlineCommentId?: string;
  type: DiscussionNotificationType;
} & (
  | {
      type: 'comment.created';
      commentId: string;
    }
  | {
      type: 'comment.replied';
      commentId: string;
    }
  | {
      type: 'comment.mention.created';
      mentionId: string;
      commentId: string;
    }
  | {
      type: 'inline_comment.created';
      inlineCommentId: string;
    }
  | {
      type: 'inline_comment.replied';
      inlineCommentId: string;
    }
  | {
      type: 'inline_comment.mention.created';
      mentionId: string;
      inlineCommentId: string;
    }
  | {
      type: 'mention.created';
      mentionId: string;
    }
);

export async function createPageNotification({
  createdBy,
  commentId,
  mentionId,
  pageId,
  inlineCommentId,
  spaceId,
  userId,
  type
}: CreatePageNotificationInput) {
  const notificationId = v4();
  await prisma.pageNotification.create({
    data: {
      type,
      id: notificationId,
      mentionId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      comment: commentId
        ? {
            connect: {
              id: commentId
            }
          }
        : undefined,
      inlineComment: inlineCommentId
        ? {
            connect: {
              id: commentId
            }
          }
        : undefined,
      page: {
        connect: {
          id: pageId
        }
      }
    }
  });
}

export async function createProposalNotification({
  type,
  createdBy,
  spaceId,
  userId,
  proposalId
}: {
  type: ProposalNotificationType;
  proposalId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
}) {
  const notificationId = v4();
  await prisma.proposalNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      proposal: {
        connect: {
          id: proposalId
        }
      }
    }
  });
}

export async function createVoteNotification({
  type,
  createdBy,
  spaceId,
  userId,
  voteId
}: {
  type: VoteNotificationType;
  voteId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
}) {
  const notificationId = v4();
  await prisma.voteNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      vote: {
        connect: {
          id: voteId
        }
      }
    }
  });
}

type CreateBountyNotificationInput = {
  type: BountyNotificationType;
  bountyId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
} & (
  | {
      type: Exclude<BountyNotificationType, 'suggestion_created'>;
      applicationId: string;
    }
  | {
      type: 'suggestion_created';
      applicationId?: string;
    }
);

export async function createBountyNotification({
  type,
  createdBy,
  spaceId,
  userId,
  bountyId,
  applicationId
}: CreateBountyNotificationInput) {
  const notificationId = v4();
  await prisma.bountyNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      application: applicationId
        ? {
            connect: {
              id: applicationId
            }
          }
        : undefined,
      bounty: {
        connect: {
          id: bountyId
        }
      }
    }
  });
}
