import useSWR from 'swr';

import charmClient from 'charmClient';

type Props = {
  // Provide value of null to skip fetching
  proposalId: string | null;
};

export function useProposalFlowFlags({ proposalId }: Props) {
  const { data, mutate } = useSWR(!proposalId ? null : `compute-flow-flags-${proposalId}`, () =>
    charmClient.proposals.computeProposalFlowFlags(proposalId as string)
  );

  return { permissions: data, refresh: mutate };
}
