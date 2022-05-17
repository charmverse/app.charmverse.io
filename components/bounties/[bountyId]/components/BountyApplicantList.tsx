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
import { applicantIsSubmitter, moveUserApplicationToFirstRow } from 'lib/applications/shared';
import { BountyStatusColours } from '../../components/BountyStatusBadge';
import { ApplicationEditorForm } from './ApplicationEditorForm';
import { SubmissionStatusColors, SubmissionStatusLabels } from '../components_v3/BountySubmissions';

/**
 * @updateApplication callback to parent [bountyId] page that implements application update logic
 */
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
        bounty.capSubmissions === false || (
          bounty.capSubmissions && acceptedApplications.length < (bounty.maxSubmissions ?? 0)
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

  const sortedApplications = moveUserApplicationToFirstRow(applications, user!);

  const userApplication = sortedApplications.find(app => app.createdBy === user?.id);

  const userHasApplied = userApplication !== undefined;

  return (
    <>
      <Box component='div' sx={{ minHeight, maxHeight, overflowY: 'auto' }}>

        <Box>
          <Button disabled={user?.addresses.length === 0 || userHasApplied} onClick={bountyApplyModal.open}>Apply now</Button>
        </Box>

        <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
          <TableHead sx={{
            background: theme.palette.background.dark,
            '.MuiTableCell-root': {
              background: theme.palette.settingsHeader.background
            }
          }}
          >
            <TableRow>
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
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          {applications.length !== 0 && (
          <TableBody>
            {sortedApplications.map((application, applicationIndex) => (
              <TableRow
                key={application.id}
                sx={{ backgroundColor: applicationIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell size='small'>
                  {
                      application.createdBy === user?.id ? 'You'
                        : getDisplayName(getContributor(application.createdBy))
                    }
                </TableCell>
                <TableCell sx={{ maxWidth: '61vw' }}>{application.message}</TableCell>
                <TableCell>{ humanFriendlyDate(application.createdAt, { withTime: true })}</TableCell>
                <TableCell align='right' sx={{ gap: 2 }}>
                  {
                      application.createdBy === user?.id && (
                        <Button
                          color='secondary'
                          variant='outlined'
                          onClick={bountyApplyModal.open}
                          endIcon={<EditOutlinedIcon fontSize='small' />}
                        >
                          Edit
                        </Button>
                      )
                    }

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
                  {
                    applicantIsSubmitter(application) && (
                      <Chip
                        sx={{ ml: 2 }}
                        label={SubmissionStatusLabels[application.status]}
                        color={SubmissionStatusColors[application.status]}
                      />
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
