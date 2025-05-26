import type { ButtonProps } from '@mui/material';
import { Box, Tooltip } from '@mui/material';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';
import { statusesAcceptingNewWork } from '@packages/lib/rewards/shared';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { AddIcon } from 'components/common/Icons/AddIcon';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useUser } from 'hooks/useUser';

type Props = {
  rewardId?: string;
  reward?: Pick<RewardWithUsers, 'id' | 'applications' | 'status' | 'allowMultipleApplications' | 'approveSubmitters'>;
  addIcon?: boolean;
  variant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  color?: ButtonProps['color'];
};

export function NewWorkButton({
  color,
  buttonSize,
  addIcon,
  rewardId: _rewardId,
  reward: _reward,
  variant = 'contained'
}: Props) {
  const rewardId = _rewardId ?? _reward?.id;
  const { user } = useUser();
  const { navigateToSpacePath } = useCharmRouter();
  const { rewards } = useRewards();

  const reward = useMemo(() => {
    return _reward ?? rewards?.find((r) => r.id === rewardId);
  }, [_reward, rewards, rewardId]);

  const hasApplication = !!user && reward?.applications.some((app) => app.createdBy === user.id);

  const { data: permissions } = useSWR(rewardId ? `/rewards-${rewardId}` : null, () =>
    charmClient.rewards.computeRewardPermissions({
      resourceId: rewardId as string
    })
  );

  async function newApplication() {
    if (!reward) return;
    navigateToSpacePath(`/rewards/applications/new`, { rewardId });
  }

  if (
    !rewardId ||
    !reward ||
    (hasApplication && !reward.allowMultipleApplications) ||
    !statusesAcceptingNewWork.includes(reward.status)
  ) {
    return null;
  }

  return (
    <Tooltip title={!permissions?.work ? 'You do not have permission to work on this reward' : ''}>
      <Box alignItems='center' display='flex' flexDirection='column' justifyContent='center'>
        <Button
          color={color}
          size={buttonSize}
          variant={variant}
          disabled={!permissions?.work}
          onClick={newApplication}
          data-test='new-work-button'
        >
          {addIcon ? (
            <AddIcon
              fontSize='small'
              iconSize='small'
              label={reward.approveSubmitters ? 'Apply for reward' : 'Create submission'}
            />
          ) : reward.approveSubmitters ? (
            'Apply for reward'
          ) : (
            'Create submission'
          )}
        </Button>
      </Box>
    </Tooltip>
  );
}
