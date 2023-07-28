import useSWR from 'swr';

import charmClient from 'charmClient';

type Props = {
  proposalId?: string | null;
};

export function useProposal({ proposalId }: Props) {
  const { data: proposal, mutate } = useSWR(!proposalId ? null : `proposal/${proposalId}`, () =>
    charmClient.proposals.getProposal(proposalId as string)
  );

  return { proposal, refreshProposal: mutate };
}
