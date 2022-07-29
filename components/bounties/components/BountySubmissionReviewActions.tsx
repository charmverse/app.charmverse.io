
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { IconButton } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Application, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { Modal } from 'components/common/Modal';
import { getChainExplorerLink } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import useIsAdmin from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { ReviewDecision, SubmissionReview } from 'lib/applications/interfaces';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import { SystemError } from 'lib/utilities/errors';
import { eToNumber } from 'lib/utilities/numbers';
import { SyntheticEvent, useState } from 'react';
import BountyPaymentButton from '../[bountyId]/components/BountyPaymentButton';

export interface BountySubmissionReviewActionsProps {
  bounty: Bounty,
  submission: ApplicationWithTransactions,
  permissions: AssignedBountyPermissions,
  reviewComplete: (updatedApplication: Application) => void
  onSubmission?: (eventOrAnchorEl?: HTMLElement | SyntheticEvent<any, Event> | null | undefined) => void
  totalAcceptedApplications: number
  disableRejectButton?: boolean
}

export default function BountySubmissionReviewActions (
  { disableRejectButton = false, totalAcceptedApplications, onSubmission, bounty, submission, reviewComplete, permissions }:
    BountySubmissionReviewActionsProps
) {
  const [user] = useUser();
  const isAdmin = useIsAdmin();
  const { refreshBounty } = useBounties();

  const [reviewDecision, setReviewDecision] = useState<SubmissionReview | null>(null);
  const [apiError, setApiError] = useState<SystemError | null>();

  async function approveApplication (applicationId: string) {
    await charmClient.approveApplication(applicationId);
    refreshBounty(bounty.id);
  }

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
      await charmClient.markSubmissionAsPaid(submission.id);
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

  const canReview = (bounty.maxSubmissions === null || (submission.status === 'applied' && (totalAcceptedApplications < bounty.maxSubmissions)) || submission.status === 'review') && permissions?.userPermissions?.review && submission.status !== 'rejected' && submission.status !== 'inProgress';

  return (
    <>
      {
        canReview && (
          <>
            <Button
              color='primary'
              size='small'
              onClick={() => {
                if (submission.status === 'applied') {
                  approveApplication(submission.id);
                }
                else if (submission.status === 'review') {
                  setReviewDecision({ decision: 'approve', submissionId: submission.id, userId: user?.id as string });
                }
              }}
            >{submission.status === 'applied' ? 'Approve application' : submission.status === 'review' ? 'Approve' : ''}
            </Button>
            {!disableRejectButton && <Button color='error' onClick={() => setReviewDecision({ submissionId: submission.id, decision: 'reject', userId: user?.id as string })}>Reject</Button>}
          </>
        )
      }
      {
        onSubmission && submission.status === 'inProgress' && submission.createdBy === user?.id && (
          <Button type='submit' onClick={onSubmission}>Submit</Button>
        )
      }
      {
        submission.status === 'review' && submission.createdBy === user?.id && (
          <Typography variant='body2' color='secondary'>Waiting review</Typography>
        )
      }
      {
        submission.status === 'applied' && submission.createdBy === user?.id && (
          <Typography variant='body2' color='secondary'>Waiting assignment</Typography>
        )
      }
      {
        submission.status === 'complete' && submission.createdBy === user?.id && (
          <Typography variant='body2' color='secondary'>Waiting payment</Typography>
        )
      }
      {isAdmin && submission.status === 'complete' && submission.walletAddress && <BountyPaymentButton onSuccess={recordTransaction} receiver={submission.walletAddress} amount={eToNumber(bounty.rewardAmount)} tokenSymbolOrAddress={bounty.rewardToken} chainIdToUse={bounty.chainId} />}
      {
        (submission.status === 'paid' && submission.transactions.length !== 0) && (
          <div>
            <a style={{ textDecoration: 'none', color: 'text.primary' }} href={getChainExplorerLink(submission.transactions[0].chainId, submission.transactions[0].transactionId)} target='_blank' rel='noreferrer'>
              <Tooltip title='View transaction details' placement='top' arrow>
                <IconButton sx={{ color: 'text.primary' }}>
                  <LaunchIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </a>
          </div>
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
                color='primary'
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

          <Button variant='outlined' color='secondary' onClick={cancel}>Cancel</Button>
        </Box>
      </Modal>
    </>
  );
}
