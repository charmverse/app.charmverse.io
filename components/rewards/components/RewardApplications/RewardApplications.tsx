import { Box, Divider, Tooltip } from '@mui/material';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { BountyPermissionFlags } from 'lib/permissions/bounties/interfaces';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { lowerCaseEqual } from 'lib/utilities/strings';

import RewardSubmissionsTable from './RewardSubmissionsTable';

type Props = {
  reward: RewardWithUsers;
  refreshReward: (rewardId: string) => void;
  permissions?: BountyPermissionFlags;
};

export function RewardApplications({ reward, refreshReward, permissions }: Props) {
  const { user } = useUser();
  const hasApplication = !!user && reward.applications.some((app) => app.createdBy === user.id);
  const { account } = useWeb3Account();

  async function newApplication() {
    await charmClient.rewards.work({ rewardId: reward.id, message: '' });
    refreshReward(reward.id);
  }

  return (
    <Box>
      <>
        <Tooltip title={!permissions?.work ? 'You do not have permission to work on this reward' : ''}>
          <Box
            alignItems='center'
            display='flex'
            flexDirection='column'
            justifyContent='center'
            sx={{ height: '100px' }}
          >
            <Button disabled={!permissions?.work} onClick={newApplication}>
              {reward.approveSubmitters ? 'New Application' : 'New Submission'}
            </Button>
          </Box>
        </Tooltip>
        <Divider />
      </>
      <RewardSubmissionsTable reward={reward} refreshReward={refreshReward} permissions={permissions} />
    </Box>
  );
}
