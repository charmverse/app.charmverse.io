import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import type { ReviewDecision } from 'lib/rewards/reviewApplication';

/**
 * @expandedOnLoad Use this to expand the application initially
 */
type Props = {
  onConfirmReview: (review: ReviewDecision) => any;
  reviewType: 'application' | 'submission';
  readOnly?: boolean;
};

export function AcceptOrRejectButtons({ onConfirmReview, reviewType, readOnly }: Props) {
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const approveLabel = reviewType === 'application' ? 'Accept' : 'Approve';

  function cancel() {
    setReviewDecision(null);
  }

  function confirmReview(value: ReviewDecision) {
    onConfirmReview(value);
    setIsLoading(true);
  }

  return (
    <Box my={1} gap={1}>
      <Grid item display='flex' gap={1}>
        <Button color='success' variant='outlined' disabled={readOnly} onClick={() => setReviewDecision('approve')}>
          {approveLabel}
        </Button>
        <Button color='error' variant='outlined' disabled={readOnly} onClick={() => setReviewDecision('reject')}>
          Reject
        </Button>
      </Grid>
      <Modal title='Confirm your review' open={reviewDecision !== null} onClose={cancel}>
        <Box>
          <Typography sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            Please confirm you want to{' '}
            <b>
              {reviewDecision} this {reviewType}
            </b>
            .
          </Typography>
          <Typography sx={{ mb: 1, whiteSpace: 'pre' }}>This decision is permanent.</Typography>
          <Box display='flex' gap={2} mt={3}>
            {reviewDecision === 'reject' && (
              <Button color='error' onClick={() => confirmReview('reject')}>
                Reject
              </Button>
            )}
            {reviewDecision === 'approve' && (
              <Button loading={isLoading} color='success' onClick={() => confirmReview('approve')}>
                {approveLabel}
              </Button>
            )}

            <Button loading={isLoading} variant='outlined' color='secondary' onClick={cancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
