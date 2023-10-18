import { useTheme } from '@emotion/react';
import { Divider } from '@mui/material';
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

import { useGetReward } from 'charmClient/hooks/rewards';
import { useUser } from 'hooks/useUser';
import { countCompleteSubmissions } from 'lib/rewards/countRemainingSubmissionSlots';

import { RewardApplicantTableRow } from './RewardApplicantTableRow';
import type { ApplicationFilterStatus } from './RewardApplicationFilter';
import { RewardApplicationFilter } from './RewardApplicationFilter';

interface Props {
  rewardId: string;
  openApplication: (applicationId: string) => void;
}

export function RewardSubmissionsTable({ rewardId, openApplication }: Props) {
  const theme = useTheme();

  const { user } = useUser();

  const { data: reward } = useGetReward({ rewardId });

  const [applicationsFilter, setApplicationsFilter] = useState<ApplicationFilterStatus>('all');

  if (!reward) {
    return null;
  }

  const validSubmissions = countCompleteSubmissions({ applications: reward.applications });

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
            label={`Complete: ${
              reward?.maxSubmissions ? `${validSubmissions} / ${reward.maxSubmissions}` : validSubmissions
            }`}
          />
          {/*
          // Re-enable later
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
          )} */}
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
                  onClickView={() => openApplication(submission.id)}
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
