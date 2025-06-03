import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import type { ReviewDecision } from '@packages/lib/rewards/reviewApplication';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useSnackbar } from 'hooks/useSnackbar';

/**
 * @expandedOnLoad Use this to expand the application initially
 */
type Props = {
  onConfirmReview: (review: ReviewDecision) => any;
  reviewType: 'application' | 'submission';
  readOnly?: boolean;
  hasApplicationSlots: boolean;
  usePaleColor?: boolean;
};

export function AcceptOrRejectButtons({
  usePaleColor = false,
  onConfirmReview,
  reviewType,
  readOnly,
  hasApplicationSlots
}: Props) {
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showMessage } = useSnackbar();

  const approveLabel = reviewType === 'application' ? 'Accept' : 'Approve';

  function cancel() {
    setReviewDecision(null);
  }

  async function confirmReview(value: ReviewDecision) {
    try {
      setIsLoading(true);
      await onConfirmReview(value);
    } catch (error: any) {
      const message = error.message || 'Something went wrong';
      showMessage(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box my={1} gap={1}>
      <Grid display='flex' gap={1}>
        <Button
          color={usePaleColor ? 'successPale' : 'success'}
          variant={usePaleColor ? 'contained' : 'outlined'}
          disabled={readOnly || !hasApplicationSlots}
          data-test='approve-reward-button'
          onClick={() => setReviewDecision('approve')}
        >
          {approveLabel}
        </Button>
        <Button
          color={usePaleColor ? 'errorPale' : 'error'}
          variant={usePaleColor ? 'contained' : 'outlined'}
          disabled={readOnly}
          data-test='reject-reward-button'
          onClick={() => setReviewDecision('reject')}
        >
          Deny
        </Button>
      </Grid>
      <Modal title='Confirm your review' open={reviewDecision !== null} onClose={cancel}>
        <Box>
          <Typography sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            Please confirm you want to{' '}
            <b>
              {reviewDecision === 'approve' ? 'approve' : 'deny'} this {reviewType}
            </b>
            .
          </Typography>
          <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>This decision is permanent.</Typography>
          <Box display='flex' gap={2} mt={3}>
            {reviewDecision === 'reject' && (
              <Button
                data-test='confirm-reject-application-button'
                color='error'
                onClick={() => confirmReview('reject')}
              >
                Deny
              </Button>
            )}
            {reviewDecision === 'approve' && (
              <Button
                data-test='confirm-approve-application-button'
                loading={isLoading}
                color='success'
                onClick={() => confirmReview('approve')}
              >
                {approveLabel}
              </Button>
            )}

            <Button data-test='cancel-review-decision-button' variant='outlined' color='secondary' onClick={cancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
