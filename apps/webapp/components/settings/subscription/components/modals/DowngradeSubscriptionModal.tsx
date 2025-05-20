import { Box, Typography } from '@mui/material';
import type { DowngradeableTier } from '@packages/subscriptions/constants';

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>Downgrade subscription</Typography>
        <Button variant='contained' onClick={onConfirm} sx={{ width: 'fit-content' }}>
          Downgrade
        </Button>
      </Box>
    </Modal>
  );
}
