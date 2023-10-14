import { useTheme } from '@emotion/react';
import { LockOpen } from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock';
import { Divider, IconButton, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useUser } from 'hooks/useUser';
import { countCompleteSubmissions } from 'lib/applications/shared';
import type { BountyPermissionFlags } from 'lib/bounties';
import { countRemainingSubmissionSlots } from 'lib/rewards/countRemainingSubmissionSlots';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { isRewardLockable } from 'lib/rewards/shared';

import { RewardApplicantTableRow } from './RewardApplicantTableRow';
import type { ApplicationFilterStatus } from './RewardApplicationFilter';
import { RewardApplicationFilter } from './RewardApplicationFilter';

interface Props {
  reward: RewardWithUsers;
  refreshReward: (rewardId: string) => void;
  permissions?: BountyPermissionFlags;
}

export default function RewardSubmissionsTable({ reward, permissions, refreshReward }: Props) {
  const theme = useTheme();

  const { user } = useUser();

  const [applicationsFilter, setApplicationsFilter] = useState<ApplicationFilterStatus>('all');

  const { showApplication } = useApplicationDialog();

  const validSubmissions = countCompleteSubmissions(reward.applications);

  async function lockRewardSubmissions() {
    const updatedReward = await charmClient.bounties.lockSubmissions(reward!.id, !reward.submissionsLocked);
    refreshReward(updatedReward.id);
  }

  const filteredApplications =
    !applicationsFilter || applicationsFilter === 'all'
      ? reward.applications
      : reward.applications.filter((a) => a.status === applicationsFilter);

  const sortedApplications = filteredApplications.sort((appA, appB) => {
    if (appA.createdBy === user?.id) {
      return -1;
    } else if (appB.createdBy === user?.id) {
      return 1;
    }
    return 0;
  });

  return (
    <>
      <Box width='100%' display='flex' mb={1} justifyContent='space-between'>
        <Box display='flex' gap={1} alignItems='center'>
          <Chip
            sx={{
              my: 1
            }}
            label={`Submissions: ${
              reward?.maxSubmissions ? `${validSubmissions} / ${reward.maxSubmissions}` : validSubmissions
            }`}
          />
          {permissions?.lock && isRewardLockable(reward) && (
            <Tooltip
              key='stop-new'
              arrow
              placement='top'
              title={`${reward.submissionsLocked ? 'Enable' : 'Prevent'} new ${
                reward.approveSubmitters ? 'applications' : 'submissions'
              } from being made.`}
            >
              <IconButton
                size='small'
                onClick={() => {
                  lockRewardSubmissions();
                }}
              >
                {!reward.submissionsLocked ? (
                  <LockOpen color='secondary' fontSize='small' />
                ) : (
                  <LockIcon color='secondary' fontSize='small' />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <RewardApplicationFilter status={applicationsFilter} onStatusSelect={setApplicationsFilter} />
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label='reward applicant table'>
            <TableHead
              sx={{
                background: theme.palette.background.dark,
                '.MuiTableCell-root': {
                  background: theme.palette.settingsHeader.background
                }
              }}
            >
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last updated</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedApplications.map((submission) => (
                <RewardApplicantTableRow
                  onClickView={() => showApplication(submission.id)}
                  submission={submission}
                  key={submission.id}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {filteredApplications.length === 0 && (
        <>
          <Box
            display='flex'
            justifyContent='center'
            my={3}
            sx={{
              opacity: 0.5
            }}
          >
            <Typography variant='h6'>No applications to display</Typography>
          </Box>
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      )}
    </>
  );
}
