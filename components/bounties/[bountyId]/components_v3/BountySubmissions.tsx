import { useTheme } from '@emotion/react';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CancelIcon from '@mui/icons-material/Cancel';
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
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { ReviewDecision } from 'lib/applications/interfaces';
import { applicantIsSubmitter, countValidSubmissions, moveUserApplicationToFirstRow, submissionsCapReached } from 'lib/applications/shared';
import { getDisplayName } from 'lib/users';
import { fancyTrim } from 'lib/utilities/strings';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import Tooltip from '@mui/material/Tooltip';
import { useBounties } from 'hooks/useBounties';
import SubmissionEditorForm from './SubmissionEditorForm';
import { BountyStatusColours } from '../../components/BountyStatusBadge';

interface Props {
  bounty: Bounty
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
  inProgress: 'In progress',
  review: 'Review',
  complete: 'Complete',
  paid: 'Paid'
};

export default function BountySubmissions ({ bounty }: Props) {

  const [user] = useUser();
  const [contributors] = useContributors();
  const theme = useTheme();

  const [submissions, setSubmissions] = useState<Application[] | null>(null);
  const { refreshBounty } = useBounties();

  const editSubmissionModal = usePopupState({ variant: 'popover', popupId: 'edit-submission' });
  const [reviewDecision, setReviewDecision] = useState<{submissionId: string, decision: ReviewDecision} | null>(null);

  const isReviewer = bounty.reviewer === user?.id;

  useEffect(() => {
    refreshSubmissions();
  }, [bounty]);

  function refreshSubmissions () {
    if (bounty) {
      charmClient.listApplications(bounty.id, true)
        .then(foundSubmissions => {
          setSubmissions(foundSubmissions);
        });
    }
  }

  async function makeSubmissionDecision (applicationId: string, decision: ReviewDecision) {
    await charmClient.reviewSubmission(applicationId, decision);
    setReviewDecision(null);
    refreshSubmissions();
    refreshBounty(bounty.id);
  }

  function submitterUpdatedSubmission () {
    editSubmissionModal.close();
    refreshSubmissions();
    refreshBounty(bounty.id);
  }

  const sortedSubmissions = submissions ? moveUserApplicationToFirstRow(submissions.filter(applicantIsSubmitter), user?.id as string) : [];

  const userSubmission = sortedSubmissions.find(sub => sub.createdBy === user?.id);

  // Calculate valid submissions for the UI
  const validSubmissions = countValidSubmissions(submissions ?? []);

  // Only applies if there is a submissions cap
  const validSubmissionsRatio = bounty.maxSubmissions ? validSubmissions / bounty.maxSubmissions as number : null;

  // Bounty open color if no cap or below cap, submission review color if cap is reached
  const chipColor = (!bounty.maxSubmissions || validSubmissions < bounty.maxSubmissions) ? BountyStatusColours.open : SubmissionStatusColors.review;

  console.log(sortedSubmissions);

  return (
    <Box>
      <Typography variant='h5'>
        Submissions
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
            <TableCell size='small' align='left'>
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
              Submissions
              <Tooltip placement='top' title={submissionsCapReached({ bounty, submissions: submissions ?? [] }) ? 'This bounty has reached the limit of submissions. No new submissions can be made at this time.' : 'This bounty is still accepting new submissions.'}>
                <Chip
                  color={chipColor}
                  sx={{ ml: 1, minWidth: '50px' }}
                  label={bounty?.maxSubmissions ? `${validSubmissions} / ${bounty.maxSubmissions}` : validSubmissions}
                />
              </Tooltip>
            </TableCell>
            {
              /* Hidden until we implement comments

            <TableCell>Last comment</TableCell>
              */
            }

            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        {sortedSubmissions.length > 0 && (
          <TableBody>
            {sortedSubmissions.map((submission, submissionIndex) => (
              <TableRow
                key={submission.id}
                sx={{ backgroundColor: submissionIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell size='small' align='left'>

                  <Chip
                    label={SubmissionStatusLabels[submission.status]}
                    color={SubmissionStatusColors[submission.status]}
                  />

                </TableCell>
                <TableCell size='small'>
                  {
                      submission.createdBy === user?.id ? 'You'
                        : getDisplayName(contributors.find(c => c.id === submission.createdBy))
                    }
                </TableCell>
                <TableCell sx={{ maxWidth: '61vw' }}>

                  {!submission.submission
                    ? (
                      <Button type='submit' onClick={editSubmissionModal.open}>Submit work</Button>
                    ) : (

                      submission.createdBy === user?.id ? (
                        <Typography
                          variant='body2'
                          onClick={editSubmissionModal.open}
                          color={theme.palette.primary?.main}
                        >
                          {fancyTrim(submission.submission, 50)}
                        </Typography>
                      ) : (
                        <Typography
                          variant='body2'
                         // TODO Popup an inline charm editor with comments
                        >
                          {fancyTrim(submission.submission, 50)}
                        </Typography>
                      )

                    )}
                </TableCell>

                {
                  /*
                  Hidden until we implement comments
                <TableCell align='right' sx={{ gap: 2 }}>
                </TableCell>
                  */
                }

                <TableCell align='right' sx={{ gap: 2 }}>
                  {
                    submission.status === 'review' && isReviewer && (
                      <Box>
                        <Tooltip placement='top' title='Approve this submission.'>
                          <AssignmentTurnedInIcon onClick={() => setReviewDecision({ decision: 'approve', submissionId: submission.id })} sx={{ mr: 3 }} />
                        </Tooltip>
                        <Tooltip placement='top' title='Reject this submission. The submitter will be disqualified from making further changes'>
                          <CancelIcon onClick={() => setReviewDecision({ submissionId: submission.id, decision: 'reject' })} />
                        </Tooltip>
                      </Box>
                    )
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      {
        userSubmission && (
          <Modal title='Your submission' open={editSubmissionModal.isOpen} onClose={editSubmissionModal.close} size='large'>
            <SubmissionEditorForm submission={userSubmission} onSubmit={submitterUpdatedSubmission} />
          </Modal>
        )
      }

      {
        isReviewer && (
          <Modal title='Confirm your review' open={reviewDecision !== null} onClose={() => setReviewDecision(null)} size='large'>

              {
                reviewDecision?.decision === 'approve' ? (
                  <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>
                    Please confirm you want to <b>approve</b> this submission.
                  </Typography>
                ) : (
                  <Box>
                    <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>
                      Please confirm you want to <b>reject</b> this submission.
                    </Typography>
                    <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>
                      The submitter will be disqualified from making further changes
                    </Typography>
                  </Box>
                )
              }

            <Typography>
              This decision is permanent.
            </Typography>

            <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>

              {
                reviewDecision?.decision === 'approve' && (
                  <Button
                    color='success'
                    sx={{ mr: 2, fontWeight: 'bold' }}
                    onClick={() => makeSubmissionDecision(reviewDecision.submissionId, 'approve')}
                  >
                    Approve submission
                  </Button>
                )
              }

              {
                reviewDecision?.decision === 'reject' && (
                  <Button
                    color='error'
                    sx={{ mr: 2, fontWeight: 'bold' }}
                    onClick={() => makeSubmissionDecision(reviewDecision.submissionId, 'reject')}
                  >
                    Reject submission
                  </Button>
                )
              }

              <Button color='secondary' onClick={() => setReviewDecision(null)}>Cancel</Button>
            </Box>
          </Modal>
        )
      }

    </Box>
  );
}
