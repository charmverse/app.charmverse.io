import { log } from '@charmverse/core/log';
import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type {
  BountyNotificationType,
  CommentNotification,
  DocumentNotificationType,
  InlineCommentNotification,
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
  const record = await prisma.postNotification.create({
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
  log.info('Created post notification', { postId, notificationId: record.id, spaceId, userId: createdBy, type });
  return record;
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
  const record = await prisma.proposalNotification.create({
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
  log.info('Created proposal notification', {
    proposalId,
    notificationId: record.id,
    spaceId,
    userId: createdBy,
    type
  });
  return record;
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
  content: Prisma.JsonValue | null;
} & (CommentNotification | MentionNotification | InlineCommentNotification);

export async function createDocumentNotification({
  createdBy,
  mentionId,
  pageId,
  inlineCommentId,
  spaceId,
  postId,
  userId,
  content,
  type,
  pageCommentId,
  postCommentId
}: CreateDocumentNotificationInput) {
  const notificationId = v4();
  const record = await prisma.documentNotification.create({
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
      content: content ?? Prisma.DbNull,
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
  log.info('Created document notification', {
    pageId,
    notificationId: record.id,
    spaceId,
    userId: createdBy,
    type
  });
  return record;
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
  const record = await prisma.cardNotification.create({
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
  log.info('Created card notification', {
    cardId,
    personPropertyId,
    notificationId: record.id,
    spaceId,
    userId: createdBy,
    type
  });
  return record;
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
  const record = await prisma.voteNotification.create({
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
  log.info('Created poll notification', {
    voteId,
    notificationId: record.id,
    spaceId,
    userId: createdBy,
    type
  });
  return record;
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
  const record = await prisma.bountyNotification.create({
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
  log.info('Created poll notification', {
    bountyId,
    applicationId,
    notificationId: record.id,
    spaceId,
    userId: createdBy,
    type
  });
  return record;
}
