import useSWR from 'swr';

import charmClient from 'charmClient';
import { AvailableProposalPermissions } from 'lib/permissions/proposals/availableProposalPermissions.class';

type Props = {
  proposalIdOrPath: string;
  spaceDomain?: string;
  isNewProposal?: boolean;
};

export function useProposalPermissions({ proposalIdOrPath, spaceDomain, isNewProposal }: Props) {
  const { data, mutate } = useSWR(
    !proposalIdOrPath ? null : `compute-proposal-category-permissions-${proposalIdOrPath}${spaceDomain ?? ''}`,
    () =>
      charmClient.permissions.proposals.computeProposalPermissions({
        proposalIdOrPath,
        spaceDomain
      })
  );

  return { permissions: isNewProposal ? new AvailableProposalPermissions().full : data, refresh: mutate };
}
