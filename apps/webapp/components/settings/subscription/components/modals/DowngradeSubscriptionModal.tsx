import { Box, Typography } from '@mui/material';
import type { DowngradeableTier } from '@packages/subscriptions/constants';
import { tierConfig } from '@packages/subscriptions/constants';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';

export function DowngradeSubscriptionModal({
  spaceId,
  newTier,
  isOpen,
  onClose,
  onSuccess
}: {
  spaceId: string;
  newTier: DowngradeableTier;
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) {
  const onConfirm = async () => {
    await charmClient.subscription.downgradeSubscription(spaceId, {
      tier: newTier
    });
    onSuccess();
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={{ mb: 2 }}>
        <Typography variant='h6' gutterBottom>
          Downgrade to {tierConfig[newTier].name}
        </Typography>
        <Typography>
          This action will downgrade your subscription to <strong>{tierConfig[newTier].name}</strong> at the beginning
          of next month.
        </Typography>
      </Box>
      <Box display='flex' justifyContent='flex-end' gap={2}>
        <Button variant='outlined' color='secondary' onClick={onClose}>
          Cancel
        </Button>
        <Button variant='contained' onClick={onConfirm}>
          Confirm
        </Button>
      </Box>
    </Modal>
  );
}
