import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import { useGetApplication, useGetRewardPermissions } from 'charmClient/hooks/rewards';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useSnackbar } from 'hooks/useSnackbar';
import { countRemainingSubmissionSlots } from '@packages/lib/rewards/countRemainingSubmissionSlots';
import type { ReviewDecision } from '@packages/lib/rewards/reviewApplication';
import type { WorkUpsertData } from '@packages/lib/rewards/work';

export type WorkInput = Omit<WorkUpsertData, 'userId'>;

export function useApplication({ applicationId }: { applicationId: string }) {
  const { rewards, refreshReward } = useRewards();
  const { data: application, mutate: refreshApplication, isLoading } = useGetApplication({ applicationId });
  const { showMessage } = useSnackbar();

  const { data: applicationRewardPermissions } = useGetRewardPermissions({ rewardId: application?.bountyId });

  const reward = useMemo(() => rewards?.find((r) => r.id === application?.bountyId), [rewards, application?.bountyId]);

  const hasApplicationSlots = useMemo(() => {
    if (!reward) return false;
    if (!reward.maxSubmissions) return true;

    const slotsLeft = countRemainingSubmissionSlots({
      applications: reward.applications ?? [],
      limit: reward.maxSubmissions
    }) as number;

    return slotsLeft > 0;
  }, [reward]);

  const reviewApplication = useCallback(
    async ({ decision }: { decision: ReviewDecision }) => {
      if (decision === 'approve' && !hasApplicationSlots) {
        showMessage('This reward has no more available slots for submissions', 'warning');
        return;
      }

      try {
        await charmClient.rewards.reviewApplication({ applicationId, decision });
      } catch (error: any) {
        const message = error.message || 'Something went wrong';
        showMessage(message, 'error');
      } finally {
        refreshApplication();
        if (application) {
          refreshReward(application?.bountyId);
        }
      }
    },
    [application, applicationId, hasApplicationSlots, refreshApplication, refreshReward, showMessage]
  );

  const updateApplication = useCallback(
    async (input: WorkInput) => {
      await charmClient.rewards.work(input);
      refreshApplication();

      if (application) {
        refreshReward(application?.bountyId);
      }
    },
    [application, refreshApplication, refreshReward]
  );
  return {
    application,
    updateApplication,
    reviewApplication,
    refreshApplication,
    isLoading,
    applicationRewardPermissions,
    hasApplicationSlots
  };
}
