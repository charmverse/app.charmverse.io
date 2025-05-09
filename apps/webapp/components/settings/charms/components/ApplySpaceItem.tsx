import { Stack, Typography } from '@mui/material';
import { useState } from 'react';

import Avatar from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import { NumericFieldWithButtons } from 'components/common/form/fields/NumericFieldWithButtons';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import type { SpaceCharmsStatus } from '@packages/lib/charms/getSpacesCharmsStatus';
import type { TransferCharmsInput } from '@packages/lib/charms/transferCharms';

type Props = {
  spaceStatus: SpaceCharmsStatus;
  userBalance: number;
  onApplyCharms: (params: TransferCharmsInput) => Promise<void>;
};

export function ApplySpaceItem({ spaceStatus, userBalance, onApplyCharms }: Props) {
  const { spaces } = useSpaces();
  const space = spaces.find((s) => s.id === spaceStatus.spaceId);
  const [charmsToApply, setCharmsToApply] = useState(0);
  const { showConfirmation } = useConfirmationModal();
  const [isSaving, setIsSaving] = useState(false);
  const { showMessage } = useSnackbar();

  const handleApplyCharms = async () => {
    setIsSaving(true);
    const { confirmed } = await showConfirmation({
      message: `Do you want to apply ${charmsToApply} charms to ${space?.name}?`
    });

    if (confirmed) {
      try {
        await onApplyCharms({ spaceId: spaceStatus.spaceId, amount: charmsToApply });
        showMessage(`You applied ${charmsToApply} charms to ${space?.name}`, 'success');
      } catch (e: any) {
        showMessage(e.message, 'error');
      }
    }

    setCharmsToApply(0);
    setIsSaving(false);
  };

  return (
    <Stack direction='row' justifyContent='space-between'>
      <Stack direction='row' gap={1}>
        <Avatar avatar={space?.spaceImage} name={space?.name} variant='rounded' />
        <Stack>
          <Typography fontWeight='bold'>{space?.name}</Typography>
          <Typography variant='caption' color='secondary'>
            has {spaceStatus.balance} Charms
          </Typography>
          <Typography variant='caption' color='secondary'>
            requires {spaceStatus.balanceNeeded} Charms/mo
          </Typography>
        </Stack>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={0.5} alignItems='center' justifyContent='center'>
        <NumericFieldWithButtons
          value={charmsToApply}
          onChange={setCharmsToApply}
          min={0}
          max={userBalance}
          disabled={!userBalance}
        />
        <Button
          variant='outlined'
          onClick={handleApplyCharms}
          loading={isSaving}
          disabled={!userBalance || userBalance < charmsToApply}
        >
          Apply
        </Button>
      </Stack>
    </Stack>
  );
}
