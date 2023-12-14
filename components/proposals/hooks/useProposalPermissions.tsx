import { AvailableProposalPermissions } from '@charmverse/core/permissions/flags';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';

type Props = {
  proposalIdOrPath?: string | null;
  spaceDomain?: string;
  isNewProposal?: boolean;
};

export function useProposalPermissions({ proposalIdOrPath, spaceDomain, isNewProposal }: Props) {
  const useProposalEvaluationPermissions = useIsCharmverseSpace();

  const { data, mutate } = useSWR(
    !proposalIdOrPath ? null : `compute-proposal-permissions-${proposalIdOrPath}${spaceDomain ?? ''}`,
    () =>
      charmClient.permissions.proposals.computeProposalPermissions({
        proposalIdOrPath: proposalIdOrPath as string,
        spaceDomain,
        useProposalEvaluationPermissions
      })
  );

  return { permissions: isNewProposal ? new AvailableProposalPermissions().full : data, refresh: mutate };
}
