import type { PageType } from '@charmverse/core/dist/cjs/prisma-client';

import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';

export type UserEntity = {
  id: string;
  avatar?: string;
  discordId?: string;
  walletAddress?: string;
  googleEmail?: string;
  username: string;
};

export type SpaceEntity = {
  avatar?: string;
  id: string;
  name: string;
  url: string;
};

export type CommentEntity = {
  createdAt: string;
  id: string;
  parentId: string | null;
  author: UserEntity;
};

export type PostEntity = {
  createdAt: string;
  id: string;
  title: string;
  url: string;
  author: UserEntity;
  category: { id: string; name: string };
};

export type ProposalEntity = {
  createdAt: string;
  id: string;
  title: string;
  url: string;
  authors: UserEntity[];
};

export type BountyEntity = {
  createdAt: string;
  id: string;
  title: string;
  url: string;
  rewardToken: string | null;
  rewardChain: number | null;
  rewardAmount: number | null;
  customReward: string | null;
};

export type PageEntity = {
  id: string;
  title: string;
  path: string;
  type: PageType;
  author: UserEntity;
};

export enum WebhookNameSpaces {
  Bounty = 'bounty',
  Forum = 'forum',
  user = 'user',
  Proposal = 'proposal',
  Page = 'page'
}

export enum WebhookEventNames {
  BountyCompleted = 'bounty.completed',
  ForumPostCommentCreated = 'forum.post.comment.created',
  ForumPostCommentReplied = 'forum.post.comment.replied',
  ForumPostCommentUpvoted = 'forum.post.comment.upvoted',
  ForumPostCommentDownvoted = 'forum.post.comment.downvoted',
  ForumPostCreated = 'forum.post.created',
  ForumPostMentionCreated = 'forum.post.mention.created',
  ForumPostCommentMentionCreated = 'forum.post.comment.mention.created',
  ProposalPassed = 'proposal.passed',
  ProposalFailed = 'proposal.failed',
  ProposalSuggestionApproved = 'proposal.suggestion_approved',
  ProposalUserVoted = 'proposal.user_voted',
  UserJoined = 'user.joined',
  HelloWorld = 'hello.world',
  PageMentionCreated = 'page.mention.created',
  PageInlineCommentCreated = 'page.inline_comment.created',
  PageInlineCommentMentionCreated = 'page.inline_comment.mention.created',
  PageInlineCommentReplied = 'page.inline_comment.replied'
}

// Utils to share common props among events
type WebhookEventSharedProps<T = WebhookEventNames> = {
  scope: T;
  space: SpaceEntity;
};

// Strongly typed events, shared between API, serverless functions and possibly our end users
export type WebhookEvent<T = WebhookEventNames> =
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ForumPostCreated;
      post: PostEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ForumPostCommentCreated;
      comment: CommentEntity;
      post: PostEntity | null;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ForumPostCommentUpvoted;
      comment: CommentEntity;
      post: PostEntity;
      voter: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ForumPostCommentDownvoted;
      comment: CommentEntity;
      post: PostEntity;
      voter: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ProposalPassed;
      proposal: ProposalEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ProposalFailed;
      proposal: ProposalEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ProposalSuggestionApproved;
      proposal: ProposalEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ProposalUserVoted;
      proposal: ProposalEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.BountyCompleted;
      bounty: BountyEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      user: UserEntity;
      scope: WebhookEventNames.PageMentionCreated | WebhookEventNames.PageInlineCommentMentionCreated;
      page: PageEntity;
      mention: UserMentionMetadata;
    })
  | (WebhookEventSharedProps<T> & {
      user: UserEntity;
      scope: WebhookEventNames.PageInlineCommentCreated | WebhookEventNames.PageInlineCommentReplied;
      page: PageEntity;
      comment: CommentEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.UserJoined;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.HelloWorld;
    });

// Webhook payload being sent by out API toward theirs
export type WebhookPayload<T = WebhookEventNames> = {
  id: string;
  createdAt: string;
  event: WebhookEvent<T>;
  spaceId: string;
  webhookURL: string | null;
  signingSecret: string | null;
};

// Payload example
// const payload: WebhookPayload = {
//   createdAt: new Date().toISOString(),
//   event: {
//     scope: WebhookEventNames.BountyCompleted,
//     bounty,
//     user
//   }
// }
