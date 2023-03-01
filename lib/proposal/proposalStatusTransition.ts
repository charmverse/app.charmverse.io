import type { ProposalStatus } from '@prisma/client';

export const proposalStatusTransitionRecord: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ['draft', 'discussion'],
  discussion: ['draft', 'draft', 'review'],
  review: ['discussion', 'reviewed'],
  reviewed: ['vote_active', 'discussion'],
  vote_active: [],
  vote_closed: []
};

export const PROPOSAL_STATUSES = Object.keys(proposalStatusTransitionRecord) as ProposalStatus[];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Draft',
  discussion: 'Discussion',
  review: 'In Review',
  reviewed: 'Reviewed',
  vote_active: 'Vote Active',
  vote_closed: 'Vote Closed'
};

export type ProposalUserGroup = 'reviewer' | 'author';

export const proposalStatusTransitionPermission: Partial<
  Record<ProposalStatus, Partial<Record<ProposalUserGroup, ProposalStatus[]>>>
> = {
  draft: {
    // Author of the proposal can move draft proposal to both draft and discussion
    // Reviewer of the proposal can't update the status of the proposal
    author: ['draft', 'discussion']
  },
  discussion: {
    author: ['draft', 'draft', 'review']
  },
  review: {
    author: ['discussion'],
    reviewer: ['reviewed', 'discussion']
  },
  reviewed: {
    author: ['discussion', 'vote_active']
  }
};

export const proposalStatusDetails: Record<ProposalStatus, string> = {
  draft: 'Only authors can view and edit this proposal',
  discussion: 'Space members can comment on this proposal',
  review: 'Reviewers can approve this proposal',
  reviewed: 'Authors can move this proposal to vote',
  vote_active: 'Space members are voting on this proposal',
  vote_closed: 'The vote is complete'
};
