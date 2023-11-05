import { Box, Tooltip } from '@mui/material';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useUser } from 'hooks/useUser';
import { statusesAcceptingNewWork } from 'lib/rewards/shared';

type Props = {
  rewardId?: string;
  onShowApplication?: VoidFunction;
};

export function NewWorkButton({ rewardId, onShowApplication }: Props) {
  const { rewards } = useRewards();
  const { user } = useUser();
  const { createApplication } = useApplicationDialog();

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

    // open modal with empty submission
    createApplication(reward.id);

    onShowApplication?.();
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
        <Button disabled={!permissions?.work} onClick={newApplication}>
          {reward.approveSubmitters ? 'Apply' : 'Submit'}
        </Button>
      </Box>
    </Tooltip>
  );
}
