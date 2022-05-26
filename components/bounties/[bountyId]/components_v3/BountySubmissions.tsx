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
import { Application, ApplicationStatus, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { Modal } from 'components/common/Modal';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { applicantIsSubmitter, countValidSubmissions, moveUserApplicationToFirstRow, submissionsCapReached } from 'lib/applications/shared';
import { getDisplayName } from 'lib/users';
import { fancyTrim } from 'lib/utilities/strings';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import UserDisplay from 'components/common/UserDisplay';
import { BountyStatusColours } from '../../components/BountyStatusBadge';
import BountySubmissionReviewActions from '../../components/BountySubmissionReviewActions';
import SubmissionEditorForm from './SubmissionEditorForm';

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
  const capReached = submissionsCapReached({ bounty, submissions: submissions ?? [] });

  // Bounty open color if no cap or below cap, submission review color if cap is reached
  const chipColor = capReached ? SubmissionStatusColors.review : BountyStatusColours.open;

  console.log(sortedSubmissions);

  const reviewerUser = bounty.reviewer ? contributors.find(c => c.id === bounty.reviewer) : undefined;

  return (
    <Box>
      <Grid container sx={{ mb: 2 }}>
        {
          reviewerUser && (
            <Grid item xs={12} sx={{ mb: 4, mt: 3 }}>
              <b>Reviewer</b>
              <UserDisplay
                user={reviewerUser}
              />
            </Grid>
          )
        }

        <Grid item xs={8}>
          <Typography variant='h5'>
            Submissions
          </Typography>
        </Grid>
        <Grid container item xs={4} direction='row' justifyContent='flex-end'>

          {
                  !bounty.approveSubmitters && !userSubmission && (
                  <Tooltip placement='top' title={capReached ? `You cannot make a new submission to this bounty. The cap of ${bounty.maxSubmissions} submission${bounty.maxSubmissions !== 1 ? 's' : ''} has been reached.` : 'Submit your work to this bounty'}>
                    <Box component='span'>
                      <Button
                        disabled={!!userSubmission}
                        onClick={editSubmissionModal.open}
                      >
                        New
                      </Button>
                    </Box>
                  </Tooltip>
                  )
                }
        </Grid>
      </Grid>

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

            </TableCell>
            {
              /* Hidden until we implement comments

            <TableCell>Last comment</TableCell>
              */
            }

            <TableCell align='right'>
              {
              // Only show submissions chip if there's a cap, or if there's at least 1
                (bounty.maxSubmissions || validSubmissions > 0) && (

                <Box>

                  <Tooltip sx={{ ml: 1 }} placement='top' title={submissionsCapReached({ bounty, submissions: submissions ?? [] }) ? 'This bounty has reached the limit of submissions. No new submissions can be made at this time.' : 'This bounty is still accepting new submissions.'}>
                    <Typography variant='body1'>
                      Submissions
                      <Box component='span' sx={{ ml: 1 }}>
                        {bounty?.maxSubmissions ? `${validSubmissions} / ${bounty.maxSubmissions}` : validSubmissions}
                      </Box>

                    </Typography>
                  </Tooltip>
                </Box>
                )
              }

            </TableCell>
          </TableRow>
        </TableHead>
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
                  (() => {
                    const contributor = contributors.find(c => c.id === submission.createdBy);

                    if (contributor) {
                      return (
                        <UserDisplay
                          avatarSize='small'
                          user={contributor}
                          fontSize='small'
                        />
                      );
                    }
                    return 'Anonymous';
                  })()

                    }
              </TableCell>
              <TableCell sx={{ maxWidth: '61vw' }}>

                {
                    submission.status === 'review' && submission.createdBy === user?.id && (
                      <Typography
                        variant='body2'
                        onClick={editSubmissionModal.open}
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

              <TableCell align='right' sx={{ gap: 2 }}>

                {
                    submission.status === 'inProgress' && submission.createdBy === user?.id && (
                      <Button type='submit' onClick={editSubmissionModal.open}>Submit</Button>
                    )
                  }

                <BountySubmissionReviewActions
                  bounty={bounty}
                  submission={submission}
                  reviewComplete={refreshSubmissions}
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
        <SubmissionEditorForm submission={userSubmission} bounty={bounty} onSubmit={submitterUpdatedSubmission} />
      </Modal>

    </Box>
  );
}
