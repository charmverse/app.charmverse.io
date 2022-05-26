
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CancelIcon from '@mui/icons-material/Cancel';
import PlagiarismIcon from '@mui/icons-material/Plagiarism';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Application, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { Modal } from 'components/common/Modal';
import { getChainExplorerLink } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import useIsAdmin from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { ReviewDecision, SubmissionReview } from 'lib/applications/interfaces';
import { SystemError } from 'lib/utilities/errors';
import { eToNumber } from 'lib/utilities/numbers';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { IconButton } from '@mui/material';
import BountyPaymentButton from '../[bountyId]/components/BountyPaymentButton';
import BountySubmissionContent from './BountySubmissionContent';

interface Props {
  bounty: Bounty,
  submission: ApplicationWithTransactions,
  reviewComplete: (updatedApplication: Application) => void
}

export default function BountySubmissionReviewActions ({ bounty, submission, reviewComplete }: Props) {

  const [user] = useUser();
  const isAdmin = useIsAdmin();
  const { refreshBounty } = useBounties();

  const [reviewDecision, setReviewDecision] = useState<SubmissionReview | null>(null);
  const [apiError, setApiError] = useState<SystemError | null>();

  const submissionContentModal = usePopupState({ variant: 'popover', popupId: 'submission-content' });

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

  async function recordTransaction (transactionId: string, chainId: number) {
    setApiError(null);
    try {
      await charmClient.recordTransaction({
        applicationId: submission.id,
        chainId: chainId.toString(),
        transactionId
      });
      await charmClient.reviewSubmission(submission.id, 'pay');
      await refreshBounty(bounty.id);
    }
    catch (err: any) {
      setApiError(err);
    }
  }

  function cancel () {
    setReviewDecision(null);
    setApiError(null);
  }

  const canReview = (user?.id === bounty.reviewer || isAdmin) && (submission.status === 'inProgress' || submission.status === 'review');

  return (
    <Box>
      {submission.status === 'complete' && submission.walletAddress && <BountyPaymentButton onSuccess={recordTransaction} receiver={submission.walletAddress} amount={eToNumber(bounty.rewardAmount)} tokenSymbolOrAddress={bounty.rewardToken} chainIdToUse={bounty.chainId} />}
      <PlagiarismIcon sx={{ mr: 3 }} onClick={submissionContentModal.open} />
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
      {
        (submission.status === 'paid' && submission.transactions.length !== 0) && (
          <a style={{ textDecoration: 'none', color: 'text.primary' }} href={getChainExplorerLink(submission.transactions[0].chainId, submission.transactions[0].transactionId)} target='_blank' rel='noreferrer'>
            <Tooltip title='View transaction details' placement='top' arrow>
              <IconButton sx={{ color: 'text.primary' }}>
                <LaunchIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </a>
        )
      }

      {
      /* Modal for viewing the content */
        <Modal open={submissionContentModal.isOpen} onClose={submissionContentModal.close} size='large'>
          <BountySubmissionContent bounty={bounty} submission={submission} />
        </Modal>
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
