import { useTheme } from '@emotion/react';
import { Stack, Box } from '@mui/material';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { useGetReward } from 'charmClient/hooks/rewards';
import { NewWorkButton } from 'components/rewards/components/RewardApplications/NewWorkButton';
import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';
import { useUser } from 'hooks/useUser';
import { countCompleteSubmissions } from 'lib/rewards/countRemainingSubmissionSlots';

import { RewardApplicantTableRow } from './RewardApplicantTableRow';
import type { ApplicationFilterStatus } from './RewardApplicationFilter';
import { RewardApplicationFilter } from './RewardApplicationFilter';

type Props = {
  rewardId: string;
  onShowApplication?: VoidFunction;
};

export function RewardApplications({ rewardId, onShowApplication }: Props) {
  const theme = useTheme();
  const { showApplication } = useApplicationDialog();

  const { user } = useUser();

  const { data: reward } = useGetReward({ rewardId });

  const [applicationsFilter, setApplicationsFilter] = useState<ApplicationFilterStatus>('all');

  if (!reward) {
    return null;
  }

  const openApplication = (applicationId: string) => {
    showApplication(applicationId);
    setTimeout(() => onShowApplication?.(), 50);
  };

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

  if (reward.applications.length === 0) {
    return (
      <Stack mt={2} mb={1}>
        <Stack>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Typography fontWeight='bold'>Reward applications</Typography>
          </Stack>
        </Stack>
        <Box display='flex' justifyContent='center' alignItems='center' gap={1}>
          <Typography
            variant='subtitle1'
            sx={{
              opacity: 0.5
            }}
          >
            There are no submissions yet.
          </Typography>
          <NewWorkButton rewardId={rewardId} onShowApplication={onShowApplication} />
        </Box>
      </Stack>
    );
  }

  return (
    <Stack mt={2}>
      <Typography fontWeight='bold'>Reward applications</Typography>
      <Box width='100%' display='flex' justifyContent='space-between' mb={1}>
        <Box display='flex' gap={1} alignItems='center'>
          <Chip
            size='small'
            sx={{
              my: 1
            }}
            label={`Complete: ${
              reward?.maxSubmissions ? `${validSubmissions} / ${reward.maxSubmissions}` : validSubmissions
            }`}
          />
        </Box>

        <RewardApplicationFilter status={applicationsFilter} onStatusSelect={setApplicationsFilter} />
      </Box>
      <Box sx={{ width: '100%', overflow: 'hidden', mb: 1 }}>
        <TableContainer sx={{ maxHeight: 440, border: '1px solid var(--input-border)', borderRadius: 1 }}>
          <Table stickyHeader size='small' aria-label='reward applicant table'>
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
      </Box>

      {filteredApplications.length === 0 && (
        <Box
          display='flex'
          justifyContent='center'
          my={3}
          sx={{
            opacity: 0.5,
            mb: 2
          }}
        >
          <Typography variant='subtitle1'>No applications to display</Typography>
        </Box>
      )}

      <Stack flex={1} direction='row' justifyContent='flex-end' mb={1}>
        <NewWorkButton rewardId={rewardId} onShowApplication={onShowApplication} />
      </Stack>
    </Stack>
  );
}
