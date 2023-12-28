import { Box, Card, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { useCreateProposalRewards } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { RewardTokenInfo } from 'components/rewards/components/RewardProperties/components/RewardTokenInfo';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from 'lib/proposal/blocks/interfaces';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';
import { isTruthy } from 'lib/utilities/types';

export type Props = {
  disabled: boolean;
  proposalId?: string;
  pendingRewards: ProposalPendingReward[] | undefined;
  rewardIds?: string[] | null;
  onSubmit?: VoidFunction;
};

export function PublishRewardsButton({ proposalId, pendingRewards, rewardIds, disabled, onSubmit }: Props) {
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const { trigger, isMutating } = useCreateProposalRewards(proposalId);
  const { showMessage } = useSnackbar();
  const { mappedFeatures } = useSpaceFeatures();
  const { rewards: allRewards } = useRewards();
  const { getRewardPage } = useRewardPage();
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

  return (
    <>
      {mappedRewards?.map(({ reward, page, draftId }) => (
        <Box display='flex' alignItems='center' gap={1} key={draftId} mb={2}>
          <Typography component='span' variant='subtitle1' fontWeight='normal'>
            {page?.title || 'Untitled'}
          </Typography>
          <Stack alignItems='center' direction='row' height='100%'>
            {reward.customReward ? (
              <Typography component='span' variant='subtitle1' fontWeight='normal'>
                {reward.customReward}
              </Typography>
            ) : (
              <RewardTokenInfo
                chainId={reward.chainId || null}
                symbolOrAddress={reward.rewardToken || null}
                rewardAmount={reward.rewardAmount || null}
              />
            )}
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
            onClick={() => setShowConfirmation(true)}
          >
            Publish {rewardsTitle}
          </Button>
          <ModalWithButtons
            open={showConfirmation}
            title={`Publish ${rewardsTitle}?`}
            buttonText='Publish'
            onClose={() => setShowConfirmation(false)}
            // wrap the function so it does not return a promise to the confirmation modal
            onConfirm={() => createRewards()}
          >
            <Typography>This action cannot be done</Typography>
          </ModalWithButtons>
        </Box>
      )}
    </>
  );
}
