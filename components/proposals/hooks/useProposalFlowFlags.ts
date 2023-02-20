import useSWR from 'swr';

import charmClient from 'charmClient';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';

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
