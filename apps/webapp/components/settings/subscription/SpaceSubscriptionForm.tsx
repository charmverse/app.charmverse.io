import { Stack, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

type SelectableTier = 'bronze' | 'silver' | 'gold';

const tierPaymentRecord: Record<SelectableTier, number> = {
  bronze: 1000,
  silver: 2500,
  gold: 10000
};

export function SpaceSubscriptionForm({
  isOpen,
  onClose,
  onSuccess,
  spaceTokenBalance
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  spaceTokenBalance: number;
}) {
  const { space } = useCurrentSpace();
  const [selectedTier, setSelectedTier] = useState<SelectableTier | null>(null);
  const [paymentPeriod, setPaymentPeriod] = useState<'month' | 'year' | 'custom'>();
  const [paymentMonths, setPaymentMonths] = useState<number>(1);

  const onUpgrade = () => {
    if (!space) {
      return;
    }

    if (!selectedTier) {
      return;
    }

    if (paymentMonths === 0) {
      return;
    }

    onSuccess();
  };

  if (!space) {
    return null;
  }

  const subscriptionPrice = selectedTier ? paymentMonths * tierPaymentRecord[selectedTier] : 0;
  const totalCost = subscriptionPrice ? subscriptionPrice - spaceTokenBalance : 0;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Stack gap={2}>
        <Stack gap={1}>
          <Typography variant='h6'>Upgrade {space.name}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Current tier: {space.subscriptionTier}
          </Typography>
        </Stack>
        <Stack gap={1}>
          <Typography variant='body2' color='text.secondary'>
            Select a tier
          </Typography>
          <Stack flexDirection='row'>
            <Button
              sx={{ flex: 1 }}
              variant={selectedTier === 'bronze' ? 'contained' : 'outlined'}
              onClick={() => setSelectedTier('bronze')}
            >
              Bronze
            </Button>
            <Button
              sx={{ flex: 1 }}
              variant={selectedTier === 'silver' ? 'contained' : 'outlined'}
              onClick={() => setSelectedTier('silver')}
            >
              Silver
            </Button>
            <Button
              sx={{ flex: 1 }}
              variant={selectedTier === 'gold' ? 'contained' : 'outlined'}
              onClick={() => setSelectedTier('gold')}
            >
              Gold
            </Button>
          </Stack>
        </Stack>
        <Stack gap={1}>
          <Typography variant='body2' color='text.secondary'>
            Select a period
          </Typography>
          <Stack flexDirection='row'>
            <Button
              sx={{ flex: 1 }}
              variant={paymentPeriod === 'month' ? 'contained' : 'outlined'}
              onClick={() => {
                setPaymentPeriod('month');
                setPaymentMonths(1);
              }}
            >
              1 month
            </Button>
            <Button
              sx={{ flex: 1 }}
              variant={paymentPeriod === 'year' ? 'contained' : 'outlined'}
              onClick={() => {
                setPaymentPeriod('year');
                setPaymentMonths(12);
              }}
            >
              1 year
            </Button>
            <Button
              sx={{ flex: 1 }}
              variant={paymentPeriod === 'custom' ? 'contained' : 'outlined'}
              onClick={() => {
                setPaymentPeriod('custom');
                setPaymentMonths(4);
              }}
            >
              Custom
            </Button>
          </Stack>
        </Stack>
        {paymentPeriod === 'custom' && (
          <Stack gap={1}>
            <Typography variant='body2' color='text.secondary'>
              Months
            </Typography>
            <TextField
              type='number'
              value={paymentMonths}
              inputProps={{ min: 1, max: 12 }}
              onChange={(e) => setPaymentMonths(Number(e.target.value))}
            />
          </Stack>
        )}
        <Stack gap={1}>
          <Stack flexDirection='row' gap={0.5} alignItems='center'>
            <Typography variant='body2' color='text.secondary'>
              Total price: {subscriptionPrice}
            </Typography>
            <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
          </Stack>
          <Stack flexDirection='row' gap={0.5} alignItems='center'>
            <Typography variant='body2' color='text.secondary'>
              Space Balance: {spaceTokenBalance}
            </Typography>
            <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
          </Stack>
          <Stack flexDirection='row' gap={0.5} alignItems='center'>
            <Typography variant='body2' color='text.secondary'>
              Total cost: {totalCost}
            </Typography>
            <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
          </Stack>
        </Stack>
        <Stack flexDirection='row' gap={1}>
          <Button
            variant='contained'
            disabled={!selectedTier || paymentMonths === 0 || !paymentPeriod}
            onClick={onUpgrade}
          >
            Upgrade tier
          </Button>
          <Button variant='outlined' onClick={onClose} color='error'>
            Cancel tier
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
