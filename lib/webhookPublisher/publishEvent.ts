import type { ProposalStatus } from '@charmverse/core/prisma-client';

import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import {
  getBountyEntity,
  getUserEntity,
  getCommentEntity,
  getSpaceEntity,
  getPostEntity,
  getProposalEntity,
  getPageEntity,
  getInlineCommentEntity,
  getVoteEntity
} from './entities';
import { publishWebhookEvent } from './publisher';

type PostEventContext = {
  scope: WebhookEventNames.ForumPostCreated;
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
  scope: WebhookEventNames.ForumCommentCreated;
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
  scope: WebhookEventNames.ForumCommentDownvoted | WebhookEventNames.ForumCommentUpvoted;
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

type ProposalEventContext =
  | {
      scope: WebhookEventNames.ProposalPassed | WebhookEventNames.ProposalFailed;
      proposalId: string;
      spaceId: string;
    }
  | {
      userId: string;
      spaceId: string;
      proposalId: string;
      scope: WebhookEventNames.ProposalStatusChanged;
      newStatus: ProposalStatus;
      oldStatus: ProposalStatus | null;
    };

export async function publishProposalEvent(context: ProposalEventContext) {
  const [space, proposal] = await Promise.all([getSpaceEntity(context.spaceId), getProposalEntity(context.proposalId)]);

  switch (context.scope) {
    case WebhookEventNames.ProposalStatusChanged: {
      const user = await getUserEntity(context.userId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space,
        user,
        oldStatus: context.oldStatus,
        newStatus: context.newStatus
      });
    }
    case WebhookEventNames.ProposalPassed:
    case WebhookEventNames.ProposalFailed: {
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space
      });
    }
    default: {
      return null;
    }
  }
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

type PageEventContext = (
  | {
      scope: WebhookEventNames.PageMentionCreated;
      mention: UserMentionMetadata;
    }
  | {
      scope: WebhookEventNames.PageCommentCreated;
      commentId: string;
    }
  | {
      scope: WebhookEventNames.PageInlineCommentCreated;
      inlineCommentId: string;
    }
) & {
  userId: string;
  spaceId: string;
  pageId: string;
};

export async function publishPageEvent(context: PageEventContext) {
  const [space, page, user] = await Promise.all([
    getSpaceEntity(context.spaceId),
    getPageEntity(context.pageId),
    getUserEntity(context.userId)
  ]);

  switch (context.scope) {
    case WebhookEventNames.PageInlineCommentCreated: {
      const inlineComment = await getInlineCommentEntity(context.inlineCommentId);
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.PageInlineCommentCreated,
        page,
        space,
        inlineComment,
        user
      });
    }
    case WebhookEventNames.PageMentionCreated: {
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.PageMentionCreated,
        page,
        space,
        user,
        mention: context.mention
      });
    }
    case WebhookEventNames.PageCommentCreated: {
      const comment = await getCommentEntity(context.commentId);
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.PageCommentCreated,
        page,
        space,
        comment,
        user
      });
    }
    default: {
      return null;
    }
  }
}

type VoteEventContext = {
  scope: WebhookEventNames.VoteCreated;
  voteId: string;
  spaceId: string;
};

export async function publishVoteEvent(context: VoteEventContext) {
  const [space, vote] = await Promise.all([getSpaceEntity(context.spaceId), getVoteEntity(context.voteId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    vote
  });
}
