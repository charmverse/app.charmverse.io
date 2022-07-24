import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Application, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';
import { useUser } from 'hooks/useUser';
import { applicantIsSubmitter, moveUserApplicationToFirstRow } from 'lib/applications/shared';
import { AssignedBountyPermissions, humaniseBountyAccessConditions } from 'lib/bounties/client';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { ApplicationEditorForm } from './ApplicationEditorForm';
import BountyApplyButton from './BountyApplyButton';

export interface IBountyApplicantListProps {
  bounty: Bounty,
  applications: Application[]
  permissions: AssignedBountyPermissions
  showHeader?: boolean
}

export function BountyApplicantList ({
  applications,
  bounty,
  permissions,
  showHeader = true
}: IBountyApplicantListProps) {
  const [user] = useUser();
  const [contributors] = useContributors();
  const { refreshBounty } = useBounties();

  const { roleups } = useRoles();

  const theme = useTheme();

  const bountyApplyModal = usePopupState({ variant: 'popover', popupId: 'apply-for-bounty' });

  async function approveApplication (applicationId: string) {
    await charmClient.approveApplication(applicationId);
    refreshBounty(bounty.id);
  }

  const acceptedApplications = applications.filter(applicantIsSubmitter);

  function displayAssignmentButton (application: Application) {
    return (
      // Only admins can approve applications for now
      (permissions.userPermissions.review)
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

  const humanisedSubmitterSentence = humaniseBountyAccessConditions({
    assignees: permissions.bountyPermissions.submitter,
    bounty,
    permissionLevel: 'submitter',
    roles: roleups
  });

  const userApplication = sortedApplications.find(app => app.createdBy === user?.id);

  return (
    <>
      <Box component='div' sx={{ minHeight, maxHeight, overflowY: 'auto' }}>
        {showHeader && (
        <Grid container sx={{ mb: 2 }}>
          <Grid item xs={8}>
            <Typography variant='h5'>
              Applicants
            </Typography>
          </Grid>
          <Grid container item xs={4} direction='row' justifyContent='flex-end'>
            <BountyApplyButton
              applications={sortedApplications}
              bounty={bounty}
              onClick={bountyApplyModal.open}
              permissions={permissions}
            />
          </Grid>
          <Grid item xs={12} sx={{ mt: 2 }}>
            {humanisedSubmitterSentence.phrase}
          </Grid>
        </Grid>
        )}

        <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
          <TableHead sx={{
            background: theme.palette.background.dark,
            '.MuiTableCell-root': {
              background: theme.palette.settingsHeader.background
            }
          }}
          >
            <TableRow>
              {/* Width should always be same as Bounty Submissions status column, so submitter and applicant columns align */}
              <TableCell sx={{ width: 120 }}>Status</TableCell>
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
                  {
                    application.status === 'applied' ? (
                      <Chip
                        label='Applied'
                        color='primary'
                      />
                    ) : (
                      <Chip
                        label='Accepted'
                        color='success'
                      />
                    )
                  }

                </TableCell>
                <TableCell size='small'>
                  {
                    (() => {
                      const contributor = contributors.find(c => c.id === application.createdBy);

                      if (contributor) {
                        return (
                          <UserDisplay
                            avatarSize='small'
                            user={contributor}
                            fontSize='small'
                            linkToProfile
                          />
                        );
                      }
                      return 'Anonymous';
                    })()
                    }
                </TableCell>
                <TableCell sx={{ maxWidth: '61vw' }}>
                  {
                    application.createdBy === user?.id && application.status === 'applied' ? (
                      <Typography sx={{ cursor: 'pointer' }} variant='body2' color={theme.palette.primary.main} onClick={bountyApplyModal.open}>
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
