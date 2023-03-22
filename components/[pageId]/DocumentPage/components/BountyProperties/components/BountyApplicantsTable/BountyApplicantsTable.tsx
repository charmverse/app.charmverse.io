import { useTheme } from '@emotion/react';
import { LockOpen } from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock';
import { Divider, IconButton, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';
import { useUser } from 'hooks/useUser';
import { countValidSubmissions, submissionsCapReached as submissionsCapReachedFn } from 'lib/applications/shared';
import type { AssignedBountyPermissions, BountyWithDetails } from 'lib/bounties';
import { isBountyLockable } from 'lib/bounties/shared';

import BountyApplicantTableRow from './BountyApplicantTableRow';

interface Props {
  bounty: BountyWithDetails;
  permissions: AssignedBountyPermissions;
}

export default function BountySubmissionsTable({ bounty, permissions }: Props) {
  const theme = useTheme();

  const { data: applications, mutate: refreshSubmissions } = useSWR(
    !bounty ? null : `/bounties/${bounty.id}/applications`,
    () => charmClient.bounties.listApplications(bounty.id),
    {
      fallbackData: [],
      // Refresh applicant info for the creator every 20 seconds
      refreshInterval: 20000
    }
  );

  const validSubmissions = countValidSubmissions(applications);
  const { refreshBounty } = useBounties();
  const { user } = useUser();
  const submissionsCapReached = submissionsCapReachedFn({
    bounty,
    submissions: applications
  });

  async function lockBountySubmissions() {
    const updatedBounty = await charmClient.bounties.lockSubmissions(bounty!.id, !bounty.submissionsLocked);
    refreshBounty(updatedBounty.id);
  }

  const filteredApplications = applications?.filter((a) => a.createdBy !== user?.id);

  return (
    <>
      <Box width='100%' display='flex' mb={1} justifyContent='space-between'>
        <Box display='flex' gap={1} alignItems='center'>
          <Chip
            sx={{
              my: 1
            }}
            label={`Submissions: ${
              bounty?.maxSubmissions ? `${validSubmissions} / ${bounty.maxSubmissions}` : validSubmissions
            }`}
          />
          {permissions?.userPermissions?.lock && isBountyLockable(bounty) && (
            <Tooltip
              key='stop-new'
              arrow
              placement='top'
              title={`${bounty.submissionsLocked ? 'Enable' : 'Prevent'} new ${
                bounty.approveSubmitters ? 'applications' : 'submissions'
              } from being made.`}
            >
              <IconButton
                size='small'
                onClick={() => {
                  lockBountySubmissions();
                }}
              >
                {!bounty.submissionsLocked ? (
                  <LockOpen color='secondary' fontSize='small' />
                ) : (
                  <LockIcon color='secondary' fontSize='small' />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Table stickyHeader aria-label='bounty applicant table'>
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
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredApplications.map((submission) => (
            <BountyApplicantTableRow
              bounty={bounty}
              permissions={permissions}
              submission={submission}
              key={submission.id}
              refreshSubmissions={refreshSubmissions}
              submissionsCapReached={submissionsCapReached}
            />
          ))}
        </TableBody>
      </Table>
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
            <Typography variant='h6'>No submissions to review</Typography>
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
