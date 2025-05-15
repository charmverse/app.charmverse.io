import { Box, MenuItem, Select, Typography } from '@mui/material';
import type { DowngradeableTier } from '@packages/lib/subscription/downgradeSubscriptionTier';
import { DowngradeableTiers } from '@packages/lib/subscription/downgradeSubscriptionTier';
import { capitalize } from '@packages/utils/strings';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function DowngradeTierModal({
  isOpen,
  onClose: _onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) {
  const { space } = useCurrentSpace();

  const [selectedTier, setSelectedTier] = useState<DowngradeableTier | null>(null);

  const onClose = () => {
    setSelectedTier(null);
    _onClose();
  };

  const onConfirm = async () => {
    if (!space) {
      return;
    }

    await charmClient.spaces.downgradeSubscriptionTier(space.id, {
      tier: selectedTier as DowngradeableTier
    });
    onSuccess();
    onClose();
  };

  if (!space) {
    return null;
  }

  const currentTierIndex = DowngradeableTiers.indexOf(space.subscriptionTier as DowngradeableTier);
  const downgradeableTiers = DowngradeableTiers.slice(0, currentTierIndex);

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>Downgrade subscription</Typography>
        <Select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value as DowngradeableTier)}>
          {downgradeableTiers.map((tier) => (
            <MenuItem key={tier} value={tier}>
              {capitalize(tier)}
            </MenuItem>
          ))}
        </Select>
        <Button variant='contained' onClick={onConfirm} disabled={!selectedTier} sx={{ width: 'fit-content' }}>
          Downgrade
        </Button>
      </Box>
    </Modal>
  );
}
