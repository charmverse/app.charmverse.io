import { Box, Card, FormLabel, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { isTruthy } from '@packages/utils/types';

import { useCreateProposalRewards } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { RewardAmount } from 'components/rewards/components/RewardAmount';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from '@packages/lib/proposals/interfaces';
import { getRelativeTimeInThePast } from '@packages/lib/utils/dates';

export type Props = {
  disabledPublishTooltip: string | null;
  proposalId?: string;
  pendingRewards: ProposalPendingReward[] | undefined;
  rewardIds?: string[] | null;
  onSubmit?: VoidFunction;
  makeRewardsPublic?: boolean;
  togglePublicRewards?: (value: boolean) => void;
};

export function RewardReviewStep({
  proposalId,
  pendingRewards,
  rewardIds,
  disabledPublishTooltip,
  onSubmit,
  makeRewardsPublic,
  togglePublicRewards
}: Props) {
  const { trigger: triggerPublishRewards, isMutating } = useCreateProposalRewards(proposalId);
  const { showMessage } = useSnackbar();
  const { mappedFeatures } = useSpaceFeatures();
  const { rewards: allRewards } = useRewards();
  const { getRewardPage } = useRewardPage();
  const { showConfirmation } = useConfirmationModal();
  const rewardsTitle = mappedFeatures.rewards.title;
  const rewards = rewardIds?.map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy) || [];

  const isAdmin = useIsAdmin();

  const disabledTogglePublicTooltip = rewards.length
    ? 'Rewards are already published for this proposal'
    : !isAdmin
      ? 'Only admins can change public reward settings'
      : null;

  async function createRewards() {
    try {
      await triggerPublishRewards();
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
      <Tooltip title={disabledTogglePublicTooltip || ''}>
        <Box display='flex' alignItems='center' justifyContent='space-between' width='100%' sx={{ mb: 1 }}>
          <FormLabel>
            <Typography component='span' variant='subtitle1'>
              {rewardsTitle} will be public
            </Typography>
          </FormLabel>

          <Switch
            checked={!!makeRewardsPublic}
            disabled={!!disabledTogglePublicTooltip}
            onChange={async (ev) => {
              togglePublicRewards?.(!!ev.target.checked);
            }}
          />
        </Box>
      </Tooltip>

      {mappedRewards?.map(({ reward, page, draftId }) => (
        <Box display='flex' alignItems='center' gap={1} key={draftId} mb={2}>
          <Typography component='span' variant='subtitle1' fontWeight='normal'>
            {page?.title || 'Untitled'}
          </Typography>
          <Stack alignItems='center' direction='row' height='100%'>
            <RewardAmount reward={reward} />
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
            disabled={!!disabledPublishTooltip}
            disabledTooltip={disabledPublishTooltip}
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
