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

export default function RewardReview({ onConfirmReview, reviewType, readOnly }: Props) {
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision | null>(null);

  const approveLabel = reviewType === 'application' ? 'Accept' : 'Approve';

  function cancel() {
    setReviewDecision(null);
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
              <Button color='error' onClick={() => onConfirmReview('reject')}>
                Reject
              </Button>
            )}
            {reviewDecision === 'approve' && (
              <Button color='success' onClick={() => onConfirmReview('approve')}>
                {approveLabel}
              </Button>
            )}

            <Button variant='outlined' color='secondary' onClick={cancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
