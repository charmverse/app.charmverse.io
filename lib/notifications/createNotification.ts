import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type {
  BountyNotificationType,
  CommentNotification,
  DocumentNotificationType,
  InlineCommentNotification,
  InlineCommentNotificationType,
  MentionNotification,
  PostNotificationType,
  ProposalNotificationType,
  VoteNotificationType
} from './interfaces';

type CreatePostNotificationInput = {
  createdBy: string;
  postId: string;
  spaceId: string;
  userId: string;
  type: PostNotificationType;
};

export async function createPostNotification({
  createdBy,
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
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      post: {
        connect: {
          id: postId
        }
      }
    }
  });
}

export type CreateProposalNotificationInput = {
  type: ProposalNotificationType;
  proposalId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
};

export async function createProposalNotification({
  type,
  createdBy,
  spaceId,
  userId,
  proposalId
}: CreateProposalNotificationInput) {
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

type CreateDocumentNotificationInput = {
  createdBy: string;
  pageId?: string;
  postId?: string;
  spaceId: string;
  userId: string;
  mentionId?: string;
  inlineCommentId?: string;
  postCommentId?: string;
  pageCommentId?: string;
  type: DocumentNotificationType;
} & (CommentNotification | MentionNotification | InlineCommentNotification);

export async function createDocumentNotification({
  createdBy,
  mentionId,
  pageId,
  inlineCommentId,
  spaceId,
  postId,
  userId,
  type,
  pageCommentId,
  postCommentId
}: CreateDocumentNotificationInput) {
  const notificationId = v4();
  await prisma.documentNotification.create({
    data: {
      id: notificationId,
      type,
      mentionId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      inlineComment: inlineCommentId
        ? {
            connect: {
              id: inlineCommentId
            }
          }
        : undefined,
      postComment: postCommentId
        ? {
            connect: {
              id: postCommentId
            }
          }
        : undefined,
      pageComment: pageCommentId
        ? {
            connect: {
              id: pageCommentId
            }
          }
        : undefined,
      post: postId
        ? {
            connect: {
              id: postId
            }
          }
        : undefined,
      page: pageId
        ? {
            connect: {
              id: pageId
            }
          }
        : undefined
    }
  });
}

export type CreateCardNotificationInput = {
  cardId: string;
  createdBy: string;
  spaceId: string;
  type: 'person_assigned';
  userId: string;
  personPropertyId: string;
};

export async function createCardNotification({
  type,
  personPropertyId,
  createdBy,
  spaceId,
  userId,
  cardId
}: CreateCardNotificationInput) {
  const notificationId = v4();
  await prisma.cardNotification.create({
    data: {
      id: notificationId,
      type,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      card: { connect: { id: cardId } },
      personPropertyId
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
  applicationId?: string;
} & (
  | {
      type: Exclude<BountyNotificationType, 'suggestion.created'>;
      applicationId: string;
    }
  | {
      type: 'suggestion.created';
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
