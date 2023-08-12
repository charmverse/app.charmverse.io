import { useMemo } from 'react';

import { useGetProposalIdsEvaluatedByUser } from 'charmClient/hooks/proposals';

export function useProposalsWhereUserIsEvaluator({ spaceId }: { spaceId?: string }) {
  const { data: proposalIdsEvaluatedByUser } = useGetProposalIdsEvaluatedByUser(spaceId);

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
