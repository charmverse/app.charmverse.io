import type { Application } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, FormLabel, IconButton, Stack, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type * as yup from 'yup';

import charmClient from 'charmClient';
import { BountyApplicantStatus } from 'components/[pageId]/DocumentPage/components/BountyProperties/components/BountyApplicantStatus';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useBounties } from 'hooks/useBounties';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useUser } from 'hooks/useUser';
import type { ReviewDecision, SubmissionReview } from 'lib/applications/interfaces';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from 'lib/applications/shared';
import type { AssignedBountyPermissions, BountyPermissionFlags } from 'lib/bounties';

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

  function cancel() {
    setReviewDecision(null);
  }

  return (
    <Box my={1} gap={1}>
      <Grid item display='flex' gap={1}>
        <Button color='success' variant='outlined' disabled={readOnly} onClick={() => setReviewDecision('approve')}>
          Approve
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
              <Button color='success' onClick={() => onConfirmReview('reject')}>
                Approve
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
