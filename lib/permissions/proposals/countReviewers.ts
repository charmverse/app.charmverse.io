import type { ProposalWithUsers } from '@charmverse/core';

// In public mode, only count reviewers who are users
export function countReviewers({ proposal }: { proposal: ProposalWithUsers }): number {
  return proposal.reviewers.filter((r) => !!r.userId).length;
}
