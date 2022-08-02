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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Application, ApplicationStatus } from '@prisma/client';
import charmClient from 'charmClient';
import MultiPaymentModal from 'components/bounties/components/MultiPaymentModal';
import { Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import useIsAdmin from 'hooks/useIsAdmin';
import useRoles from 'hooks/useRoles';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { applicantIsSubmitter, countValidSubmissions, moveUserApplicationToFirstRow, submissionsCapReached } from 'lib/applications/shared';
import { humaniseBountyAccessConditions } from 'lib/bounties/client';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import { fancyTrim } from 'lib/utilities/strings';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { BountyWithDetails } from 'models';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import BountySubmissionContent from '../../components/BountySubmissionContent';
import BountySubmissionReviewActions from '../../components/BountySubmissionReviewActions';
import BountyReviewers from './BountyReviewers';
import SubmissionEditorForm from '../../components/BountyApplicantForm/components/SubmissionEditorForm';

interface Props {
  bounty: BountyWithDetails
  permissions: AssignedBountyPermissions
  showMetadata?: boolean
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

export default function BountySubmissions ({ showMetadata = true, bounty, permissions }: Props) {
  const [user] = useUser();
  const [contributors] = useContributors();
  const { roleups } = useRoles();
  const theme = useTheme();
  const isAdmin = useIsAdmin();
  const { refreshBounty } = useBounties();
  const editSubmissionModal = usePopupState({ variant: 'popover', popupId: 'edit-submission' });

  const [submissions, setSubmissions] = useState<ApplicationWithTransactions[] | null>(null);
  const [currentViewedSubmission, setCurrentViewedSubmission] = useState<Application | null>(null);

  const sortedSubmissions = submissions ? moveUserApplicationToFirstRow(submissions.filter(applicantIsSubmitter), user?.id as string) : [];
  const userSubmission = sortedSubmissions.find(sub => sub.createdBy === user?.id);
  // Calculate valid submissions for the UI
  const validSubmissions = countValidSubmissions(submissions ?? []);
  // Only applies if there is a submissions cap
  const capReached = submissionsCapReached({ bounty, submissions: submissions ?? [] });
  const humanisedSubmitterSentence = humaniseBountyAccessConditions({
    assignees: permissions.bountyPermissions.submitter,
    bounty,
    permissionLevel: 'submitter',
    roles: roleups
  });
  const canCreateSubmission = !userSubmission && !capReached && permissions?.userPermissions.work;
  const newSubmissionTooltip = !permissions?.userPermissions.work ? 'You do not have the correct role to submit work to this bounty' : (capReached ? 'The submissions cap has been reached. This bounty is closed to new submissions.' : 'Create a new submission to this bounty.');

  function refreshSubmissions () {
    if (bounty) {
      charmClient.listApplications(bounty.id)
        .then(foundSubmissions => {
          setSubmissions(foundSubmissions);
        });
    }
  }

  function submitterUpdatedSubmission () {
    editSubmissionModal.close();
    refreshSubmissions();
    refreshBounty(bounty.id);
  }

  useEffect(() => {
    refreshSubmissions();
  }, [bounty]);

  return (
    <Box>
      {showMetadata && (
        <Grid container sx={{ mb: 2 }}>

          <BountyReviewers
            bounty={bounty}
            permissions={permissions}
          />
          <Grid item xs={8}>
            <Typography variant='h5'>
              Submissions
              <Chip
                sx={{ ml: 1 }}
                label={`${bounty?.maxSubmissions ? `${validSubmissions} / ${bounty.maxSubmissions}` : validSubmissions}`}
              />

            </Typography>
          </Grid>
          <Grid container item xs={4} direction='row' justifyContent='flex-end'>
            {
              !bounty.approveSubmitters && !userSubmission && (
                <Tooltip placement='top' title={newSubmissionTooltip}>
                  <Box component='span'>
                    <Button
                      disabled={!canCreateSubmission}
                      onClick={editSubmissionModal.open}
                    >
                      New
                    </Button>
                  </Box>
                </Tooltip>
              )
            }
          </Grid>
          {
            !bounty.approveSubmitters && (
              <Grid item xs={12} sx={{ mt: 2 }}>
                {humanisedSubmitterSentence.phrase}
              </Grid>
            )
          }

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
            {/* Width should always be same as Bounty Applicant list status column, so submitter and applicant columns align */}
            <TableCell sx={{ width: 120 }} align='left'>
              Status
            </TableCell>
            <TableCell>
              <Box sx={{
                display: 'flex',
                alignItems: 'center'
              }}
              >
                {/* <AutorenewIcon onClick={refreshsubmissions} /> */}
                Submitter
              </Box>
            </TableCell>
            <TableCell>
            </TableCell>
            {
              /* Hidden until we implement comments

            <TableCell>Last comment</TableCell>
              */
            }

            <TableCell align='right'>
              {isAdmin && <MultiPaymentModal bounties={[bounty]} />}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedSubmissions.map((submission, submissionIndex) => (
            <TableRow
              key={submission.id}
              sx={{ backgroundColor: submissionIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
              hover
            >
              <TableCell size='small' align='left'>
                <Box display='flex' gap={1}>
                  <Chip
                    label={SubmissionStatusLabels[submission.status]}
                    color={SubmissionStatusColors[submission.status]}
                  />
                </Box>
              </TableCell>
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
              <TableCell sx={{ maxWidth: '61vw', cursor: 'pointer' }} onClick={!(submission.status === 'review' && submission.createdBy === user?.id) ? () => setCurrentViewedSubmission(submission) : editSubmissionModal.open}>

                {
                  submission.status === 'review' && submission.createdBy === user?.id && (
                    <Typography
                      variant='body2'
                      color={theme.palette.primary?.main}
                    >
                      {fancyTrim(submission.submission ?? '', 50)}
                    </Typography>
                  )
                }

                {
                  // Either another user is seeing this, or the user who made the submission, and they can't edit it further
                  ((submission.status !== 'review' && submission.createdBy === user?.id) || (submission.createdBy !== user?.id)) && (
                    <Typography
                      variant='body2'
                    >
                      {fancyTrim(submission.submission ?? '', 50)}
                    </Typography>
                  )
                }

              </TableCell>

              {
                /*
                Hidden until we implement comments
              <TableCell align='right' sx={{ gap: 2 }}>
              </TableCell>
                */
              }

              <TableCell align='right' sx={{ gap: 2, justifyContent: 'flex-end' }}>
                <BountySubmissionReviewActions
                  bounty={bounty}
                  submission={submission}
                  reviewComplete={refreshSubmissions}
                  onSubmission={editSubmissionModal.open}
                  permissions={permissions}
                  totalAcceptedApplications={0}
                />

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {submissions?.length === 0 && (
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

      <Modal title='Your submission' open={editSubmissionModal.isOpen} onClose={editSubmissionModal.close} size='large'>
        <SubmissionEditorForm permissions={permissions} submission={userSubmission} bountyId={bounty.id} onSubmit={submitterUpdatedSubmission} />
      </Modal>

      {
        /* Modal for viewing the content */
        <Modal open={currentViewedSubmission !== null} onClose={() => setCurrentViewedSubmission(null)} size='large'>
          <BountySubmissionContent submission={currentViewedSubmission as Application} />
        </Modal>
      }

    </Box>
  );
}
