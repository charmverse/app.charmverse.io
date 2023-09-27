import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import {
  getBountyEntity,
  getUserEntity,
  getCommentEntity,
  getSpaceEntity,
  getPostEntity,
  getProposalEntity,
  getDocumentEntity,
  getInlineCommentEntity,
  getBlockCommentEntity
} from './entities';
import { publishWebhookEvent } from './publisher';

type PostEventContext = {
  scope: WebhookEventNames.PostCreated;
  spaceId: string;
  postId: string;
};

export async function publishPostEvent(context: PostEventContext) {
  const [post, space] = await Promise.all([getPostEntity(context.postId), getSpaceEntity(context.spaceId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    post
  });
}

type CommentEventContext = {
  scope: WebhookEventNames.CommentCreated;
  spaceId: string;
  postId: string;
  commentId: string;
};

export async function publishPostCommentEvent(context: CommentEventContext) {
  const [post, comment, space] = await Promise.all([
    getPostEntity(context.postId),
    getCommentEntity(context.commentId),
    getSpaceEntity(context.spaceId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    comment,
    post
  });
}

type CommentVoteEventContext = {
  scope: WebhookEventNames.CommentDownvoted | WebhookEventNames.CommentUpvoted;
  spaceId: string;
  postId: string;
  commentId: string;
  voterId: string;
};

export async function publishPostCommentVoteEvent(context: CommentVoteEventContext) {
  const [post, comment, space, voter] = await Promise.all([
    getPostEntity(context.postId),
    getCommentEntity(context.commentId),
    getSpaceEntity(context.spaceId),
    getUserEntity(context.voterId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    comment,
    post,
    voter
  });
}

type MemberEventContext = {
  scope: WebhookEventNames.UserJoined;
  spaceId: string;
  userId: string;
};

export async function publishMemberEvent(context: MemberEventContext) {
  const [space, user] = await Promise.all([getSpaceEntity(context.spaceId), getUserEntity(context.userId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    user
  });
}

type BountyEventContext = {
  scope: WebhookEventNames.BountyCompleted;
  bountyId: string;
  spaceId: string;
  userId: string;
};

export async function publishBountyEvent(context: BountyEventContext) {
  const [space, bounty, user] = await Promise.all([
    getSpaceEntity(context.spaceId),
    getBountyEntity(context.bountyId),
    getUserEntity(context.userId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    bounty,
    space,
    user
  });
}

type ProposalEventContext = {
  scope: WebhookEventNames.ProposalPassed | WebhookEventNames.ProposalFailed;
  proposalId: string;
  spaceId: string;
};

export async function publishProposalEvent(context: ProposalEventContext) {
  const [space, proposal] = await Promise.all([getSpaceEntity(context.spaceId), getProposalEntity(context.proposalId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    proposal,
    space
  });
}

type ProposalUserEventContext = {
  scope: WebhookEventNames.ProposalSuggestionApproved | WebhookEventNames.ProposalUserVoted;
  proposalId: string;
  spaceId: string;
  userId: string;
};

export async function publishUserProposalEvent(context: ProposalUserEventContext) {
  const [space, proposal, user] = await Promise.all([
    getSpaceEntity(context.spaceId),
    getProposalEntity(context.proposalId),
    getUserEntity(context.userId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    proposal,
    space,
    user
  });
}

type DocumentEventContext = (
  | {
      scope: WebhookEventNames.DocumentMentionCreated;
      mention: UserMentionMetadata;
    }
  | {
      scope: WebhookEventNames.DocumentInlineCommentCreated;
      inlineCommentId: string;
    }
) & {
  userId: string;
  spaceId: string;
  documentId: string;
};

export async function publishDocumentEvent(context: DocumentEventContext) {
  const [space, document, user] = await Promise.all([
    getSpaceEntity(context.spaceId),
    getDocumentEntity(context.documentId),
    getUserEntity(context.userId)
  ]);

  switch (context.scope) {
    case WebhookEventNames.DocumentInlineCommentCreated: {
      const inlineComment = await getInlineCommentEntity(context.inlineCommentId);
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document,
        inlineComment,
        user,
        space
      });
    }
    case WebhookEventNames.DocumentMentionCreated: {
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.DocumentMentionCreated,
        document,
        user,
        mention: context.mention,
        space
      });
    }
    default: {
      return null;
    }
  }
}

type CardEventContext =
  | {
      scope: WebhookEventNames.CardBlockCommentCreated;
      cardId: string;
      spaceId: string;
      blockCommentId: string;
    }
  | {
      scope: WebhookEventNames.CardPersonPropertyAssigned;
      cardId: string;
      spaceId: string;
      assignedUserId: string;
      userId: string;
    };

export async function publishCardEvent(context: CardEventContext) {
  const { scope } = context;
  const [space, card] = await Promise.all([getSpaceEntity(context.spaceId), getDocumentEntity(context.cardId)]);

  switch (scope) {
    case WebhookEventNames.CardBlockCommentCreated: {
      const blockComment = await getBlockCommentEntity(context.blockCommentId);
      return publishWebhookEvent(context.spaceId, {
        scope,
        space,
        card,
        blockComment
      });
    }
    case WebhookEventNames.CardPersonPropertyAssigned: {
      const assignedUser = await getUserEntity(context.assignedUserId);
      return publishWebhookEvent(context.spaceId, {
        scope,
        space,
        card,
        assignedUser,
        personPropertyId: context.assignedUserId,
        user: await getUserEntity(context.userId)
      });
    }
    default: {
      return null;
    }
  }
}
