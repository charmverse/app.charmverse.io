import { useTheme } from '@emotion/react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Application, Bounty, User } from '@prisma/client';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useContributors } from 'hooks/useContributors';
import useIsAdmin from 'hooks/useIsAdmin';
import { getDisplayName } from 'lib/users';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { Modal } from 'components/common/Modal';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useBounties } from 'hooks/useBounties';
import { applicantIsSubmitter, moveUserApplicationToFirstRow, submissionsCapReached } from 'lib/applications/shared';
import { Tooltip } from '@mui/material';
import { BountyStatusColours } from '../../components/BountyStatusBadge';
import { ApplicationEditorForm } from './ApplicationEditorForm';
import { SubmissionStatusColors, SubmissionStatusLabels } from '../components_v3/BountySubmissions';

export interface IBountyApplicantListProps {
  bounty: Bounty,
  applications: Application[]
}

export function BountyApplicantList ({
  applications,
  bounty
}: IBountyApplicantListProps) {
  const [user] = useUser();
  const [contributors] = useContributors();
  const { refreshBounty } = useBounties();

  const isAdmin = useIsAdmin();

  const theme = useTheme();

  const bountyApplyModal = usePopupState({ variant: 'popover', popupId: 'apply-for-bounty' });

  function getContributor (userId: string) {
    return contributors.find(c => c.id === userId);
  }

  // if (loading.current === true) {
  //   return (
  //     <>
  //       <Typography>Loading proposals</Typography>
  //       <CircularProgress/>
  //     </>
  //   );
  // }

  async function approveApplication (applicationId: string) {
    await charmClient.approveApplication(applicationId);
    refreshBounty(bounty.id);
  }

  const acceptedApplications = applications.filter(applicantIsSubmitter);

  const isReviewer = bounty.reviewer === user?.id;

  function displayAssignmentButton (application: Application) {
    return (
      // Only admins can approve applications for now
      (isAdmin === true || isReviewer)
      && application.status === 'applied'
      // If we reached the cap, we can't assign new people
      && (
        bounty.maxSubmissions === null || (
          acceptedApplications.length < (bounty.maxSubmissions ?? 0)
        )
      ));
  }

  const applicationsMade = applications.length;

  let maxHeight: null | number | string = 400;

  let minHeight: null | number | string = applicationsMade === 0 ? 100 : 100 * applicationsMade;

  // Ensure table only starts scrolling once we've received more than a few applications
  if (minHeight > maxHeight) {
    minHeight = null;
    maxHeight = `${maxHeight}px`;
  }
  else {
    // We don't need to change maxHeight to null as minHeight always overrides maxHeight
    minHeight = `${minHeight}px`;
  }

  const sortedApplications = moveUserApplicationToFirstRow(applications, user?.id as string);

  const userApplication = sortedApplications.find(app => app.createdBy === user?.id);

  const userHasApplied = userApplication !== undefined;

  const newApplicationsSuspended = submissionsCapReached({
    bounty,
    submissions: applications
  });

  console.log('New applications suspended', newApplicationsSuspended);

  return (
    <>
      <Box component='div' sx={{ minHeight, maxHeight, overflowY: 'auto' }}>

        <Typography variant='h5'>
          Applicants
        </Typography>

        <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
          <TableHead sx={{
            background: theme.palette.background.dark,
            '.MuiTableCell-root': {
              background: theme.palette.settingsHeader.background
            }
          }}
          >
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center'
                }}
                >
                  {/* <AutorenewIcon onClick={refreshApplications} /> */}
                  Applicant
                </Box>
              </TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align='right'>
                {
                  !userHasApplied && (
                  <Tooltip placement='top' title={newApplicationsSuspended ? `You cannot apply to this bounty. The cap of ${bounty.maxSubmissions} submission${bounty.maxSubmissions !== 1 ? 's' : ''} has been reached.` : ''}>
                    <Box component='span'>
                      <Button disabled={newApplicationsSuspended} onClick={bountyApplyModal.open}>Apply now</Button>
                    </Box>
                  </Tooltip>
                  )
                }

              </TableCell>
            </TableRow>
          </TableHead>
          {applications.length !== 0 && (
          <TableBody>
            {sortedApplications.map((application, applicationIndex) => (
              <TableRow
                key={application.id}
                sx={{ backgroundColor: applicationIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell align='left'>
                  <Chip
                    label={SubmissionStatusLabels[application.status]}
                    color={SubmissionStatusColors[application.status]}
                  />
                </TableCell>
                <TableCell size='small'>
                  {
                      application.createdBy === user?.id ? 'You'
                        : getDisplayName(getContributor(application.createdBy))
                    }
                </TableCell>
                <TableCell sx={{ maxWidth: '61vw' }}>
                  {
                    application.createdBy === user?.id && application.status === 'applied' ? (
                      <Typography variant='body2' color={theme.palette.primary.main} onClick={bountyApplyModal.open}>
                        {application.message}
                      </Typography>
                    ) : (
                      <Typography variant='body2'>
                        {application.message}
                      </Typography>
                    )
                  }
                </TableCell>
                <TableCell>{ humanFriendlyDate(application.createdAt, { withTime: true })}</TableCell>
                <TableCell align='right' sx={{ gap: 2 }}>
                  {
                    displayAssignmentButton(application) === true && (
                      <Button
                        sx={{ ml: 2 }}
                        onClick={() => {
                          approveApplication(application.id);
                        }}
                      >
                        Assign
                      </Button>
                    )
                  }

                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          )}
        </Table>
        {applications.length === 0 && (
        <Box
          my={3}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            opacity: 0.5
          }}
        >
          <Typography variant='h6'>
            No applications
          </Typography>
        </Box>
        )}
      </Box>
      <Modal title='Bounty Application' size='large' open={bountyApplyModal.isOpen} onClose={bountyApplyModal.close}>
        <ApplicationEditorForm
          bountyId={bounty.id}
          onSubmit={bountyApplyModal.close}
          proposal={userApplication}
          mode={userApplication ? 'update' : 'create'}
        />
      </Modal>
    </>
  );
}
