import { Stack, TextField, Typography, Card, Divider, Tooltip } from '@mui/material';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

type SelectableTier = 'bronze' | 'silver' | 'gold' | 'readonly' | 'free';

const tierPaymentRecord: Record<SelectableTier, number> = {
  readonly: 0,
  free: 0,
  bronze: 1000,
  silver: 2500,
  gold: 10000
};

function calculateTotalCost({
  currentTier,
  selectedTier,
  paymentMonths,
  spaceTokenBalance
}: {
  currentTier?: SelectableTier | null;
  selectedTier: SelectableTier | null;
  paymentMonths: number;
  spaceTokenBalance: number;
}) {
  const fullMonthPrice = selectedTier ? tierPaymentRecord[selectedTier] : 0;

  let unusedValue = 0;
  let proratedFirstMonthCost = 0;
  let remainingMonthsCost = 0;
  let totalCost = 0;

  const now = DateTime.now();
  const monthEnd = now.endOf('month');
  const daysRemaining = Math.floor(monthEnd.diff(now, 'days').days) + 1;
  const totalDays = monthEnd.diff(now.startOf('month'), 'days').days + 1;

  if (selectedTier && (currentTier === 'free' || currentTier === 'readonly')) {
    unusedValue = Math.round(fullMonthPrice * (daysRemaining / totalDays));
    proratedFirstMonthCost = fullMonthPrice - unusedValue;
    remainingMonthsCost = (paymentMonths - 1) * fullMonthPrice;
    totalCost = Math.max(Math.round(proratedFirstMonthCost + remainingMonthsCost - spaceTokenBalance), 0);
  } else {
    // handle paid-to-paid upgrade if needed
    totalCost = Math.max(fullMonthPrice * paymentMonths - spaceTokenBalance, 0);
  }

  return {
    fullMonthPrice,
    totalCost,
    unusedValue
  };
}

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
  const currentTier = space?.subscriptionTier as SelectableTier | null;

  const { totalCost, fullMonthPrice, unusedValue } = calculateTotalCost({
    currentTier,
    selectedTier,
    paymentMonths,
    spaceTokenBalance
  });

  const onUpgrade = () => {
    if (!space || !selectedTier || paymentMonths === 0) return;
    // TODO: Call backend with prorated calculation
    onSuccess();
  };

  if (!space) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Stack gap={2}>
        <Stack gap={0.5}>
          <Typography variant='h6'>Upgrade {space.name}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Current tier: <b style={{ textTransform: 'capitalize' }}>{space.subscriptionTier}</b>
          </Typography>
        </Stack>
        <Divider />
        {/* Tier Selection */}
        <Stack gap={1}>
          <Typography variant='subtitle2'>Select a tier</Typography>
          <Stack direction='row' spacing={1}>
            {(['bronze', 'silver', 'gold'] as SelectableTier[]).map((tier) => (
              <Button
                key={tier}
                sx={{ flex: 1 }}
                variant={selectedTier === tier ? 'contained' : 'outlined'}
                onClick={() => setSelectedTier(tier)}
                disabled={currentTier === tier}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </Button>
            ))}
          </Stack>
        </Stack>
        {/* Period Selection */}
        <Stack gap={1}>
          <Typography variant='subtitle2'>Select a period</Typography>
          <Stack direction='row' spacing={1}>
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
          {paymentPeriod === 'custom' && (
            <Stack my={1}>
              <Typography variant='body2' color='text.secondary'>
                Months
              </Typography>
              <TextField
                variant='outlined'
                type='number'
                value={paymentMonths}
                inputProps={{ min: 1, max: 12 }}
                onChange={(e) => setPaymentMonths(Number(e.target.value))}
                sx={{ mt: 1 }}
              />
            </Stack>
          )}
        </Stack>
        {/* Price Summary */}
        <Card variant='outlined' sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Stack gap={1}>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body2'>New tier price</Typography>
              <Stack direction='row' alignItems='center' gap={0.5}>
                <Typography variant='body2'>{fullMonthPrice * paymentMonths}</Typography>
                <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
              </Stack>
            </Stack>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body2'>Unused value (prorated)</Typography>
              <Stack direction='row' alignItems='center' gap={0.5}>
                <Typography variant='body2'>- {unusedValue}</Typography>
                <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
              </Stack>
            </Stack>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body2'>Space Balance</Typography>
              <Stack direction='row' alignItems='center' gap={0.5}>
                <Typography variant='body2'>- {spaceTokenBalance}</Typography>
                <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
              </Stack>
            </Stack>
            <Divider />
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='subtitle2' fontWeight={600}>
                Total cost
              </Typography>
              <Stack direction='row' alignItems='center' gap={0.5}>
                <Typography variant='subtitle2' fontWeight={600}>
                  {totalCost}
                </Typography>
                <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />
              </Stack>
            </Stack>
          </Stack>
        </Card>
        {/* Actions */}
        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <Button variant='outlined' onClick={onClose} color='error'>
            Cancel
          </Button>
          <Tooltip title={!selectedTier || !paymentPeriod ? 'Select tier and period' : ''}>
            <span>
              <Button
                variant='contained'
                disabled={!selectedTier || paymentMonths === 0 || !paymentPeriod}
                onClick={onUpgrade}
              >
                Upgrade tier
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Modal>
  );
}
