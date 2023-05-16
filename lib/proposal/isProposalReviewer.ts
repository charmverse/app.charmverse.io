import type { IsProposalReviewerFnInput } from '@charmverse/core';

export function isProposalReviewer({ userId, proposal }: IsProposalReviewerFnInput): boolean {
  return !!userId && proposal.reviewers.some((r) => r.userId === userId);
}
