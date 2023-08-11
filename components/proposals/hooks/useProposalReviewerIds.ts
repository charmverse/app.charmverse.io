import useSWR from 'swr';

import charmClient from 'charmClient';

export function useProposalReviewerIds(proposalId?: string) {
  const { data: reviewerUserIds = [] } = useSWR(proposalId ? `proposal-reviewers-${proposalId}` : null, () =>
    charmClient.proposals.getAllReviewerUserIds(proposalId as string)
  );

  return {
    reviewerUserIds
  };
}
