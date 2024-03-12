import { Box, Card, Stack, Typography } from '@mui/material';

import { useCreateProposalRewards } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { RewardAmount } from 'components/rewards/components/RewardStatusBadge';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';
import { isTruthy } from 'lib/utils/types';

export type Props = {
  disabled: boolean;
  proposalId?: string;
  pendingRewards: ProposalPendingReward[] | undefined;
  rewardIds?: string[] | null;
  onSubmit?: VoidFunction;
};

export function PublishRewardsButton({ proposalId, pendingRewards, rewardIds, disabled, onSubmit }: Props) {
  const { trigger, isMutating } = useCreateProposalRewards(proposalId);
  const { showMessage } = useSnackbar();
  const { mappedFeatures } = useSpaceFeatures();
  const { rewards: allRewards } = useRewards();
  const { getRewardPage } = useRewardPage();
  const { showConfirmation } = useConfirmationModal();
  const rewardsTitle = mappedFeatures.rewards.title;
  const rewards = rewardIds?.map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy) || [];

  async function createRewards() {
    try {
      await trigger();
      showMessage(`${rewardsTitle} created`, 'success');
      onSubmit?.();
      // mutateRewards();
    } catch (e) {
      showMessage((e as any).message, 'error');
    }
  }

  const publishDate = rewards.length ? getRelativeTimeInThePast(new Date(rewards[0].createdAt)) : null;
  const mappedRewards = pendingRewards?.length
    ? pendingRewards
    : rewards.map((reward) => ({
        reward,
        page: getRewardPage(reward.id),
        draftId: reward.id
      }));

  async function handlePublish() {
    const { confirmed } = await showConfirmation({
      message: 'This action cannot be undone.',
      confirmButton: 'Publish'
    });
    if (confirmed) {
      createRewards();
    }
  }

  return (
    <>
      {mappedRewards?.map(({ reward, page, draftId }) => (
        <Box display='flex' alignItems='center' gap={1} key={draftId} mb={2}>
          <Typography component='span' variant='subtitle1' fontWeight='normal'>
            {page?.title || 'Untitled'}
          </Typography>
          <Stack alignItems='center' direction='row' height='100%'>
            <RewardAmount
              reward={{
                chainId: reward.chainId || null,
                customReward: reward.customReward || null,
                rewardAmount: reward.rewardAmount || null,
                rewardToken: reward.rewardToken || null
              }}
              truncate={true}
              truncatePrecision={2}
              typographyProps={{ variant: 'body2', fontWeight: 'normal', fontSize: 'normal' }}
            />
          </Stack>
        </Box>
      ))}

      {rewards.length ? (
        <Card variant='outlined'>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
            <Typography variant='body2'>Published {publishDate}</Typography>
          </Stack>
        </Card>
      ) : (
        <Box display='flex' justifyContent='flex-end'>
          <Button
            disabled={disabled}
            disabledTooltip={`Only reviewers can publish ${rewardsTitle}`}
            loading={isMutating}
            onClick={handlePublish}
          >
            Publish {rewardsTitle}
          </Button>
        </Box>
      )}
    </>
  );
}
