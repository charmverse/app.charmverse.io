import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import {
  getBountyEntity,
  getUserEntity,
  getCommentEntity,
  getSpaceEntity,
  getPostEntity,
  getProposalEntity,
  getPageEntity
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

type PageEventContext = (
  | {
      scope: WebhookEventNames.PageMentionCreated | WebhookEventNames.PageInlineCommentMentionCreated;
      mention: UserMentionMetadata;
      commentId: null | string;
    }
  | {
      scope: WebhookEventNames.PageInlineCommentCreated | WebhookEventNames.PageInlineCommentReplied;
      mention: null;
      commentId: string;
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

  if (
    context.scope === WebhookEventNames.PageInlineCommentCreated ||
    context.scope === WebhookEventNames.PageInlineCommentReplied
  ) {
    const comment = await getCommentEntity(context.commentId, { inlineComment: true });
    return publishWebhookEvent(context.spaceId, {
      scope: context.scope,
      page,
      space,
      comment,
      user
    });
  }

  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    page,
    space,
    mention: context.mention as UserMentionMetadata,
    user
  });
}
