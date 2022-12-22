import type { Space } from '@prisma/client';

export type UserEntity = {
  avatar: string;
  id: string;
  discordId: string;
  username: string;
};

export type CommentEntity = {
  createdAt: string;
  id: string;
  parentId: string;
  threadId: string;
  author: UserEntity;
};

export type DiscussionEntity = {
  id: string;
  title: string;
  url: string;
  author: UserEntity;
  category: string;
};

export type ProposalEntity = {
  id: string;
  title: string;
  url: string;
  authors: UserEntity[];
};

export type BountyEntity = {
  id: string;
  title: string;
  url: string;
  rewardToken: string;
  rewardChain: string;
  rewardAmount: number;
};

enum WebhookEventNames {
  DiscussionCreated = 'discussion.created',
  CommentCreated = 'comment.created',
  CommentUpvoted = 'comment.upvoted',
  CommentDownvoted = 'comment.downvoted',
  ProposalPassed = 'proposal.passed',
  ProposalFailed = 'proposal.failed',
  ProposalSuggestionApproved = 'proposal.suggestion_approved',
  ProposalUserVote = 'proposal.user_voted',
  BountyCompleted = 'bounty.completed'
}

// Utils to share common props among events
type WebhookEventSharedProps<T = WebhookEventNames> = {
  name: T;
};

// Strongly typed events, shared between API, serverless functions and possibly our end users
export type WebhookEvent<T = WebhookEventNames> =
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.DiscussionCreated;
      discussion: DiscussionEntity;
    })
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.CommentCreated;
      comment: CommentEntity;
      discussion: DiscussionEntity;
    })
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.CommentUpvoted;
      comment: CommentEntity;
      discussion: DiscussionEntity;
      voter: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.CommentDownvoted;
      comment: CommentEntity;
      discussion: DiscussionEntity;
      voter: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.ProposalPassed;
      proposal: ProposalEntity;
    })
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.ProposalFailed;
      proposal: ProposalEntity;
    })
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.ProposalSuggestionApproved;
      proposal: ProposalEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.ProposalUserVote;
      proposal: ProposalEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      name: WebhookEventNames.BountyCompleted;
      bounty: BountyEntity;
      user: UserEntity;
    });

// Webhook payload being sent by out API toward theirs
export type WebhookPayload<T = WebhookEventNames> = {
  createdAt: string;
  event: WebhookEvent<T>;
  spaceId: Space['id'];
  // resource: {
  //   id: string;
  //   type: T;
  // };
};

// Payload example
// const payload: WebhookPayload = {
//   createdAt: new Date().toISOString(),
//   event: {
//     name: WebhookEventNames.BountyCompleted,
//     bounty,
//     user
//   }
// }
