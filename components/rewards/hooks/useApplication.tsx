import type { Application } from '@charmverse/core/prisma-client';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useGetApplication, useGetRewardPermissions } from 'charmClient/hooks/rewards';
import type { ReviewDecision, SubmissionUpdateData } from 'lib/applications/interfaces';

export function useApplication({ applicationId }: { applicationId: string }) {
  const { data: application, mutate: refreshApplication, isLoading } = useGetApplication({ applicationId });

  const { data: applicationRewardPermissions } = useGetRewardPermissions({ rewardId: application?.bountyId });

  const approveApplication = useCallback(async () => {
    await charmClient.rewards.approveApplication(applicationId);
    refreshApplication();
  }, [refreshApplication]);

  const reviewSubmission = useCallback(
    async ({ reviewDecision }: { reviewDecision: ReviewDecision }) => {
      await charmClient.rewards.reviewSubmission(applicationId, reviewDecision);
      refreshApplication();
    },
    [refreshApplication]
  );

  const updateApplication = useCallback(
    async (input: { applicationId: string; update: Partial<Application> }) => {
      await charmClient.rewards.updateApplication(input);
      refreshApplication();
    },
    [refreshApplication]
  );

  const updateSubmission = useCallback(
    async (input: SubmissionUpdateData) => {
      await charmClient.rewards.updateSubmission(input);
      refreshApplication();
    },
    [refreshApplication]
  );

  return {
    application,
    updateApplication,
    approveApplication,
    reviewSubmission,
    updateSubmission,
    refreshApplication,
    isLoading,
    applicationRewardPermissions
  };
}
