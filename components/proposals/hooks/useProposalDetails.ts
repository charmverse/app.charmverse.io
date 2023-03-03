import useSWR from 'swr';

import charmClient from 'charmClient';

export function useProposalDetails(proposalId: string | null) {
  const { data: proposal, mutate: refreshProposal } = useSWR(proposalId ? `proposal/${proposalId}` : null, () =>
    charmClient.proposals.getProposal(proposalId!)
  );

  return { proposal, refreshProposal };
}
