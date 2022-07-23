import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Application, ApplicationStatus, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { applicantIsSubmitter, countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import BountySubmissionContent from '../../components/BountySubmissionContent';
import BountySubmissionReviewActions from '../../components/BountySubmissionReviewActions';
import { ApplicationEditorForm } from '../components/ApplicationEditorForm';
import BountyApplicationForm from './BountyApplicationForm';

interface Props {
  bounty: Bounty
  permissions: AssignedBountyPermissions
}

export const SubmissionStatusColors: Record<ApplicationStatus, BrandColor> = {
  applied: 'teal',
  rejected: 'red',
  inProgress: 'yellow',
  review: 'orange',
  complete: 'pink',
  paid: 'gray'
};

export const SubmissionStatusLabels: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  rejected: 'Rejected',
  inProgress: 'In Progress',
  review: 'In Review',
  complete: 'Complete',
  paid: 'Paid'
};

export default function BountySubmissionsTable ({ bounty, permissions }: Props) {
  const [user] = useUser();
  const [contributors] = useContributors();
  const theme = useTheme();
  const { refreshBounty } = useBounties();
  const editSubmissionModal = usePopupState({ variant: 'popover', popupId: 'edit-submission' });
  const bountyApplyModal = usePopupState({ variant: 'popover', popupId: 'apply-for-bounty' });

  const [submissions, setSubmissions] = useState<ApplicationWithTransactions[]>([]);
  const [currentViewedSubmission, setCurrentViewedSubmission] = useState<Application | null>(null);
  const acceptedApplications = submissions.filter(applicantIsSubmitter);
  const userApplication = submissions.find(app => app.createdBy === user?.id);
  const validSubmissions = countValidSubmissions(submissions);

  function refreshSubmissions () {
    if (bounty) {
      charmClient.listApplications(bounty.id)
        .then(foundSubmissions => {
          setSubmissions(foundSubmissions);
        });
    }
  }

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

  async function approveApplication (applicationId: string) {
    await charmClient.approveApplication(applicationId);
    refreshBounty(bounty.id);
  }

  useEffect(() => {
    refreshSubmissions();
  }, [bounty]);

  return (
    <Box>
      <Chip
        label={`Submissions: ${bounty?.maxSubmissions ? `${validSubmissions} / ${bounty.maxSubmissions}` : validSubmissions}`}
      />

      <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
        <TableHead sx={{
          background: theme.palette.background.dark,
          '.MuiTableCell-root': {
            background: theme.palette.settingsHeader.background
          }
        }}
        >
          <TableRow>
            {/* Width should always be same as Bounty Applicant list status column, so submitter and applicant columns align */}
            <TableCell>
              <Box sx={{
                display: 'flex',
                alignItems: 'center'
              }}
              >
                Applicant
              </Box>
            </TableCell>
            <TableCell sx={{ width: 120 }} align='left'>
              Status
            </TableCell>
            <TableCell>
              Last updated
            </TableCell>
            <TableCell align='right'>
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {submissions.map((submission, submissionIndex) => (
            <TableRow
              key={submission.id}
              sx={{ backgroundColor: submissionIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
              hover
            >
              <TableCell size='small'>
                {(() => {
                  const contributor = contributors.find(c => c.id === submission.createdBy);

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
                })()}
              </TableCell>
              <TableCell size='small' align='left'>
                <Box display='flex' gap={1}>
                  <Chip
                    label={SubmissionStatusLabels[submission.status]}
                    color={SubmissionStatusColors[submission.status]}
                  />
                </Box>
              </TableCell>
              <TableCell>{humanFriendlyDate(submission.updatedAt, { withTime: true })}</TableCell>
              <TableCell align='right' sx={{ gap: 2, justifyContent: 'flex-end' }}>
                {
                  displayAssignmentButton(submission) === true ? (
                    <Button
                      sx={{ ml: 2 }}
                      onClick={() => {
                        approveApplication(submission.id);
                      }}
                    >
                      Assign
                    </Button>
                  ) : (
                    <BountySubmissionReviewActions
                      bounty={bounty}
                      submission={submission}
                      reviewComplete={refreshSubmissions}
                      onSubmission={editSubmissionModal.open}
                      permissions={permissions}
                    />
                  )
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {submissions.length === 0 && (
        <Box
          my={3}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            opacity: 0.5
          }}
        >
          <Typography variant='h6'>
            No submissions
          </Typography>
        </Box>
      )}

      <BountyApplicationForm
        bounty={bounty}
        permissions={permissions}
        submissions={submissions}
      />

      <Modal title='Bounty Application' size='large' open={bountyApplyModal.isOpen} onClose={bountyApplyModal.close}>
        <ApplicationEditorForm
          bountyId={bounty.id}
          onSubmit={bountyApplyModal.close}
          proposal={userApplication}
          mode={userApplication ? 'update' : 'create'}
        />
      </Modal>

      <Modal open={currentViewedSubmission !== null} onClose={() => setCurrentViewedSubmission(null)} size='large'>
        <BountySubmissionContent submission={currentViewedSubmission as Application} />
      </Modal>
    </Box>
  );
}
