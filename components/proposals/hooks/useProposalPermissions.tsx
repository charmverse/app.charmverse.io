import { AvailableProposalPermissions } from '@charmverse/core/permissions/flags';
import useSWR from 'swr';

import charmClient from 'charmClient';

type Props = {
  proposalIdOrPath?: string | null;
  spaceDomain?: string;
  isNewProposal?: boolean;
};

export function useProposalPermissions({ proposalIdOrPath, spaceDomain, isNewProposal }: Props) {
  const { data, mutate } = useSWR(
    !proposalIdOrPath ? null : `compute-proposal-permissions-${proposalIdOrPath}${spaceDomain ?? ''}`,
    () =>
      charmClient.permissions.proposals.computeProposalPermissions({
        proposalIdOrPath: proposalIdOrPath as string,
        spaceDomain
      })
  );

  return { permissions: isNewProposal ? new AvailableProposalPermissions().full : data, refresh: mutate };
}
