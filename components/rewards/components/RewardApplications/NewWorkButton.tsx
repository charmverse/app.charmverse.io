import type { ButtonProps } from '@mui/material';
import { Box, Tooltip } from '@mui/material';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { AddIcon } from 'components/common/Icons/AddIcon';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useUser } from 'hooks/useUser';
import { statusesAcceptingNewWork } from 'lib/rewards/shared';

type Props = {
  rewardId?: string;
  addIcon?: boolean;
  variant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  color?: ButtonProps['color'];
};

export function NewWorkButton({ color, buttonSize, addIcon, rewardId, variant = 'contained' }: Props) {
  const { rewards } = useRewards();
  const { user } = useUser();
  const { updateURLQuery, navigateToSpacePath } = useCharmRouter();
  const isCharmverseSpace = useIsCharmverseSpace();

  const reward = useMemo(() => {
    return rewards?.find((r) => r.id === rewardId);
  }, [rewardId, rewards]);

  const hasApplication = !!user && reward?.applications.some((app) => app.createdBy === user.id);

  const { data: permissions } = useSWR(rewardId ? `/rewards-${rewardId}` : null, () =>
    charmClient.rewards.computeRewardPermissions({
      resourceId: rewardId as string
    })
  );

  async function newApplication() {
    if (!reward) return;

    if (isCharmverseSpace) {
      navigateToSpacePath(`/rewards/applications/new`, { rewardId });
    } else {
      // open modal with empty submission
      updateURLQuery({ id: rewardId, applicationId: 'new' });
    }
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
