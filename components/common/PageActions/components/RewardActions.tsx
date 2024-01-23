import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import { ListItemText, MenuItem, Tooltip } from '@mui/material';
import { useSWRConfig } from 'swr';

import charmClient from 'charmClient';
import { useGetRewardPermissions } from 'charmClient/hooks/rewards';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useSnackbar } from 'hooks/useSnackbar';
import { submissionIsComplete } from 'lib/rewards/countRemainingSubmissionSlots';

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

  const isMarkRewardPaidEnabled =
    rewardPermissions?.mark_paid &&
    reward.status !== 'paid' &&
    reward.status !== 'complete' &&
    reward.applications.length > 0 &&
    reward.applications.every(
      (submission) => submissionIsComplete({ application: submission }) || submission.status === 'rejected'
    );

  const isMarkrewardCompletedEnabled = rewardPermissions?.lock && reward.status === 'open';

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

  async function closereward() {
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

  const disabledMarkrewardPaidTooltipMessage = !rewardPermissions?.mark_paid
    ? "You don't have permission to mark this reward as paid"
    : `All applications must be completed or marked as paid to mark this reward as paid`;
  const disabledMarkrewardCompletedTooltipMessage = !rewardPermissions?.lock
    ? `You don't have permission to mark this reward as complete`
    : 'This reward cannot be marked as complete';

  return (
    <>
      <Tooltip title={!isMarkRewardPaidEnabled ? disabledMarkrewardPaidTooltipMessage : ''}>
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
      <Tooltip title={!isMarkrewardCompletedEnabled ? disabledMarkrewardCompletedTooltipMessage : ''}>
        <div>
          <MenuItem dense onClick={closereward} disabled={!isMarkrewardCompletedEnabled}>
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
