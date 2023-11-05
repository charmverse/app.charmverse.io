import type { BountyStatus } from '@charmverse/core/prisma-client';
import { Box, Divider, Tooltip } from '@mui/material';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import type { BountyPermissionFlags } from 'lib/permissions/bounties/interfaces';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { statusesAcceptingNewWork } from 'lib/rewards/shared';

import { RewardSubmissionsTable } from './RewardSubmissionsTable';

type Props = {
  reward: RewardWithUsers;
  refreshReward: (rewardId: string) => void;
  permissions?: BountyPermissionFlags;
  openApplication: (applicationId: string) => void;
};

export function RewardApplications({ reward, refreshReward, permissions, openApplication }: Props) {
  const { user } = useUser();
  const hasApplication = !!user && reward.applications.some((app) => app.createdBy === user.id);

  async function newApplication() {
    const application = await charmClient.rewards.work({ rewardId: reward.id, message: '' });
    refreshReward(reward.id);
    openApplication(application.id);
  }

  return (
    <Box>
      {(!hasApplication || (hasApplication && reward.allowMultipleApplications)) &&
        statusesAcceptingNewWork.includes(reward.status) && (
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
        )}
      <RewardSubmissionsTable rewardId={reward.id} openApplication={openApplication} />
    </Box>
  );
}
