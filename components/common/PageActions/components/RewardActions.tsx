import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import { ListItemText, MenuItem, Tooltip } from '@mui/material';
import { useSWRConfig } from 'swr';

import charmClient from 'charmClient';
import { useGetRewardPermissions } from 'charmClient/hooks/rewards';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useSnackbar } from 'hooks/useSnackbar';

export function RewardActions({ rewardId, onClick }: { rewardId: string; onClick?: VoidFunction }) {
  const { refreshReward, rewards } = useRewards();
  const { mutate } = useSWRConfig();
  const { showMessage } = useSnackbar();

  const { data: rewardPermissions } = useGetRewardPermissions({
    rewardId
  });
  const reward = rewards?.find((_reward) => _reward.id === rewardId);

  if (!reward) {
    return null;
  }

  const isMarkRewardPaidEnabled = rewardPermissions?.mark_paid && reward.status !== 'paid';

  const isMarkRewardCompletedEnabled = rewardPermissions?.lock && reward.status === 'open';

  async function markRewardAsPaid() {
    try {
      await charmClient.rewards.markRewardAsPaid(rewardId);
      if (refreshReward) {
        refreshReward(rewardId);
      }
      await mutate(`/rewards/${rewardId}/applications`);
      onClick?.();
    } catch (error) {
      showMessage((error as Error)?.message || (error as any), 'error');
    }
  }

  async function closeReward() {
    try {
      await charmClient.rewards.closeReward(rewardId);
      if (refreshReward) {
        refreshReward(rewardId);
      }
      onClick?.();
    } catch (error) {
      showMessage((error as Error)?.message || (error as any), 'error');
    }
  }

  const disabledMarkRewardPaidTooltipMessage = !rewardPermissions?.mark_paid
    ? "You don't have permission to mark this reward as paid"
    : reward.status === 'paid'
      ? 'This reward is already marked as paid'
      : `All applications must be completed or marked as paid to mark this reward as paid`;
  const disabledMarkRewardCompletedTooltipMessage = !rewardPermissions?.lock
    ? `You don't have permission to mark this reward as complete`
    : 'This reward cannot be marked as complete';

  return (
    <>
      <Tooltip title={!isMarkRewardPaidEnabled ? disabledMarkRewardPaidTooltipMessage : ''}>
        <div>
          <MenuItem dense onClick={markRewardAsPaid} disabled={!isMarkRewardPaidEnabled}>
            <PaidIcon
              sx={{
                mr: 1
              }}
              fontSize='small'
            />
            <ListItemText primary='Mark paid' />
          </MenuItem>
        </div>
      </Tooltip>
      <Tooltip title={!isMarkRewardCompletedEnabled ? disabledMarkRewardCompletedTooltipMessage : ''}>
        <div>
          <MenuItem dense onClick={closeReward} disabled={!isMarkRewardCompletedEnabled}>
            <CheckCircleOutlinedIcon
              sx={{
                mr: 1
              }}
              fontSize='small'
            />
            <ListItemText primary='Mark complete' />
          </MenuItem>
        </div>
      </Tooltip>
    </>
  );
}
