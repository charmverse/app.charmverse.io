import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';

export function useProposalsWhereUserIsEvaluator({ spaceId }: { spaceId?: string }) {
  const { data: proposalIdsEvaluatedByUser } = useSWR(
    spaceId ? `spaces/${spaceId}/proposals-evaluated-by-user` : null,
    () => charmClient.proposals.getProposalIdsEvaluatedByUser(spaceId as string)
  );

  const proposalsEvaluatedByUserMapped = useMemo(() => {
    return (proposalIdsEvaluatedByUser?.userIsEvaluator ?? []).reduce((acc, val) => {
      acc[val] = val;
      return acc;
    }, {} as Record<string, string>);
  }, [proposalIdsEvaluatedByUser]);

  const proposalsNotEvaluatedByUserMapped = useMemo(() => {
    return (proposalIdsEvaluatedByUser?.userIsNotEvaluator ?? []).reduce((acc, val) => {
      acc[val] = val;
      return acc;
    }, {} as Record<string, string>);
  }, [proposalIdsEvaluatedByUser]);

  return {
    rubricProposalIdsWhereUserIsEvaluator: proposalsEvaluatedByUserMapped,
    rubricProposalIdsWhereUserIsNotEvaluator: proposalsNotEvaluatedByUserMapped
  };
}
