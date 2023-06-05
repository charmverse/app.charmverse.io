import type { IsProposalReviewerFnInput } from '@charmverse/core/permissions';

export function isProposalReviewer({ userId, proposal }: IsProposalReviewerFnInput): boolean {
  return !!userId && proposal.reviewers.some((r) => r.userId === userId);
}
