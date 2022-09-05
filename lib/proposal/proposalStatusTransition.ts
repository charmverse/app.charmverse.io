import { ProposalStatus } from '@prisma/client';

export const proposalStatusTransitionRecord: Record<ProposalStatus, ProposalStatus[]> = {
  private_draft: ['draft', 'discussion'],
  draft: ['private_draft', 'discussion'],
  discussion: ['private_draft', 'draft', 'review'],
  review: ['discussion', 'reviewed'],
  reviewed: [],
  vote_active: [],
  vote_closed: []
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  private_draft: 'Private draft',
  draft: 'Draft',
  discussion: 'Discussion',
  review: 'In Review',
  reviewed: 'Reviewed',
  vote_active: 'Vote Active',
  vote_closed: 'Vote Closed'
};

type ProposalUserGroup = 'reviewer' | 'author';

export const proposalStatusUserTransitionRecord: Partial<Record<ProposalStatus, Partial<Record<ProposalUserGroup, ProposalStatus[]>>>> = {
  private_draft: {
    author: ['draft', 'discussion']
  },
  draft: {
    author: ['private_draft', 'discussion']
  },
  discussion: {
    author: ['private_draft', 'draft', 'review']
  },
  review: {
    author: ['discussion'],
    reviewer: ['review']
  }
};
