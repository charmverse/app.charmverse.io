import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';

export function useProposalsWhereUserIsEvaluator({ spaceId }: { spaceId?: string }) {
  const { data: proposalIdsEvaluatedByUser } = useSWR(spaceId ? `proposals/${spaceId}` : null, () =>
    charmClient.proposals.getProposalIdsEvaluatedByUser(spaceId as string)
  );

  const proposalsEvaluatedByUserMapped = useMemo(() => {
    return (proposalIdsEvaluatedByUser ?? []).reduce((acc, val) => {
      acc[val] = val;
      return acc;
    }, {} as Record<string, string>);
  }, [proposalIdsEvaluatedByUser]);

  return {
    proposalIdsWhereUserIsEvaluator: proposalsEvaluatedByUserMapped
  };
}
