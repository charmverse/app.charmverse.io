
import { useTheme } from '@emotion/react';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PlagiarismIcon from '@mui/icons-material/Plagiarism';
import CancelIcon from '@mui/icons-material/Cancel';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Application, ApplicationStatus, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { Modal } from 'components/common/Modal';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { ReviewDecision, SubmissionReview } from 'lib/applications/interfaces';
import { applicantIsSubmitter, countValidSubmissions, moveUserApplicationToFirstRow, submissionsCapReached } from 'lib/applications/shared';
import { getDisplayName } from 'lib/users';
import { fancyTrim } from 'lib/utilities/strings';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { BrandColor } from 'theme/colors';
import Tooltip from '@mui/material/Tooltip';
import { useBounties } from 'hooks/useBounties';
import useIsAdmin from 'hooks/useIsAdmin';
import { SystemError } from 'lib/utilities/errors';
import { BountyStatusColours } from './BountyStatusBadge';

interface Props {
  bounty: Bounty,
  submission: Application,
  reviewComplete: (updatedApplication: Application) => void
}

export default function BountySubmissionReviewActions ({ bounty, submission, reviewComplete }: Props) {

  const [user] = useUser();
  const isAdmin = useIsAdmin();
  const { refreshBounty } = useBounties();

  const [reviewDecision, setReviewDecision] = useState<SubmissionReview | null>(null);
  const [apiError, setApiError] = useState<SystemError | null>();

  function makeSubmissionDecision (applicationId: string, decision: ReviewDecision) {
    setApiError(null);
    charmClient.reviewSubmission(applicationId, decision)
      .then((reviewedSubmission) => {
        // Closes the modal
        setReviewDecision(null);
        reviewComplete(reviewedSubmission);
        refreshBounty(bounty.id);
      })
      .catch(err => {
        setApiError(err);
      });

  }

  function cancel () {
    setReviewDecision(null);
    setApiError(null);
  }

  const canReview = (user?.id === bounty.reviewer || isAdmin) && (submission.status === 'inProgress' || submission.status === 'review');

  return (
    <Box>

      <PlagiarismIcon sx={{ mr: 3 }} />
      {
      canReview && (
        <>
          <Tooltip placement='top' title='Approve this submission.'>
            <AssignmentTurnedInIcon onClick={() => setReviewDecision({ decision: 'approve', submissionId: submission.id })} sx={{ mr: 3 }} />
          </Tooltip>
          <Tooltip placement='top' title='Reject this submission. The submitter will be disqualified from making further changes'>
            <CancelIcon onClick={() => setReviewDecision({ submissionId: submission.id, decision: 'reject' })} />
          </Tooltip>
        </>
      )
    }

      {/* Modal which provides review confirmation */}
      <Modal title='Confirm your review' open={reviewDecision !== null} onClose={cancel} size='large'>

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

        {
          apiError && (
            <Alert sx={{ mt: 2, mb: 2 }} severity={apiError.severity}>
              {apiError.message}
            </Alert>
          )
        }

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

          <Button color='secondary' onClick={cancel}>Cancel</Button>
        </Box>
      </Modal>
    </Box>
  );
}
