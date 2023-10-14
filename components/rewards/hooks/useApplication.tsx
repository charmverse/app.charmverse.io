import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useGetApplication, useGetRewardPermissions } from 'charmClient/hooks/rewards';
import type { ReviewDecision } from 'lib/rewards/reviewApplication';
import type { WorkUpsertData } from 'lib/rewards/work';

export function useApplication({ applicationId }: { applicationId: string }) {
  const { data: application, mutate: refreshApplication, isLoading } = useGetApplication({ applicationId });

  const { data: applicationRewardPermissions } = useGetRewardPermissions({ rewardId: application?.bountyId });

  const reviewApplication = useCallback(
    async ({ decision }: { decision: ReviewDecision }) => {
      await charmClient.rewards.reviewApplication({ applicationId, decision });
      refreshApplication();
    },
    [refreshApplication]
  );

  const updateApplication = useCallback(
    async (input: Omit<WorkUpsertData, 'userId'>) => {
      await charmClient.rewards.work(input);
      refreshApplication();
    },
    [refreshApplication]
  );
  return {
    application,
    updateApplication,
    reviewApplication,
    refreshApplication,
    isLoading,
    applicationRewardPermissions
  };
}
