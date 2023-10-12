import { Box, Divider, Tooltip } from '@mui/material';
import Paper from '@mui/material/Paper';

import charmClient from 'charmClient';
import { useGetReward } from 'charmClient/hooks/rewards';
import { Button } from 'components/common/Button';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { BountyPermissionFlags } from 'lib/bounties';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { lowerCaseEqual } from 'lib/utilities/strings';

import RewardSubmissionsTable from './RewardSubmissionsTable';

type Props = {
  reward: RewardWithUsers;
  refreshReward: (rewardId: string) => void;
  permissions: BountyPermissionFlags;
};

export function RewardApplications({ reward, refreshReward, permissions }: Props) {
  const { user } = useUser();
  const hasApplication = !!user && reward.applications.some((app) => app.createdBy === user.id);
  const { account } = useWeb3Account();

  async function newApplication() {
    if (!hasApplication) {
      if (reward.approveSubmitters) {
        await charmClient.rewards.createApplication({ bountyId: reward.id, message: '' });
      } else {
        await charmClient.rewards.createSubmission({
          bountyId: reward.id,
          submissionContent: {
            submission: '',
            submissionNodes: JSON.stringify({ ...emptyDocument }),
            walletAddress:
              account && user?.wallets.some((w) => lowerCaseEqual(w.address, account)) ? account : undefined
          }
        });
      }

      refreshReward(reward.id);
    }
  }

  return (
    <Box>
      <>
        <Tooltip title={!permissions.work ? 'You do not have permission to work on this reward' : ''}>
          <Box
            alignItems='center'
            display='flex'
            flexDirection='column'
            justifyContent='center'
            sx={{ height: '100px' }}
          >
            <Button disabled={!permissions.work} onClick={newApplication}>
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
