import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { capitalize, Card, Divider, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { calculateSubscriptionCost } from '@packages/subscriptions/calculateSubscriptionCost';
import type { UpgradableTier } from '@packages/subscriptions/constants';
import Image from 'next/image';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { useTransferDevToken } from '../../hooks/useTransferDevToken';

export function UpgradeSubscriptionModal({
  spaceId,
  isOpen,
  onClose: _onClose,
  onSuccess,
  currentTier,
  newTier
}: {
  spaceId: string;
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  currentTier: SpaceSubscriptionTier | null;
  newTier: UpgradableTier;
}) {
  const [paymentPeriod, setPaymentPeriod] = useState<'month' | 'year' | 'custom'>('month');
  const [paymentMonths, setPaymentMonths] = useState<number>(1);
  const { showMessage } = useSnackbar();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { newTierPrice, amountToProrate, priceForMonths, devTokensToSend } = calculateSubscriptionCost({
    currentTier,
    newTier,
    paymentMonths
  });

  function onClose() {
    _onClose();
    setPaymentPeriod('month');
    setPaymentMonths(1);
  }

  const { isTransferring, transferDevToken } = useTransferDevToken();

  const isLoading = isTransferring || isUpgrading;

  async function onUpgrade() {
    setIsUpgrading(true);

    try {
      if (devTokensToSend > 0) {
        const result = await transferDevToken(devTokensToSend);
        if (!result) return;
        await charmClient.subscription.recordSubscriptionContribution(spaceId, {
          hash: result.hash,
          walletAddress: result.address,
          paidTokenAmount: result.transferredAmount.toString(),
          signature: result.signature,
          message: result.message
        });
      }

      await charmClient.subscription
        .upgradeSubscription(spaceId, {
          tier: newTier,
          paymentMonths
        })
        .catch((err) => {
          showMessage(err?.message ?? 'Failed to upgrade space subscription. Please try again later.', 'error');
        })
        .then(() => {
          showMessage('Space subscription upgraded successfully', 'success');
          onSuccess();
          onClose();
        });
    } catch (error) {
      showMessage('Failed to upgrade space subscription. Please try again later.', 'error');
    } finally {
      setIsUpgrading(false);
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Stack gap={2}>
        <Typography variant='h6'>
          Switch to <strong>{capitalize(newTier)}</strong>
        </Typography>
        <Divider />
        <Stack gap={1}>
          <Typography variant='subtitle2'>Select a period</Typography>
          <Stack direction='row' spacing={1}>
            <Button
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                disabled={isLoading}
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
        <Card variant='outlined' sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Stack gap={1}>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body2'>
                {paymentMonths} months x {newTierPrice}
              </Typography>
              <Stack direction='row' alignItems='center' gap={0.5}>
                <Typography variant='body2'>{priceForMonths}</Typography>
                <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
              </Stack>
            </Stack>
            {amountToProrate ? (
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body2'>Prorated discount</Typography>
                <Stack direction='row' alignItems='center' gap={0.5}>
                  <Typography variant='body2'>- {amountToProrate}</Typography>
                  <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
                </Stack>
              </Stack>
            ) : null}
            <Divider />
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='subtitle2' fontWeight={600}>
                Total payment
              </Typography>
              <Stack direction='row' alignItems='center' gap={0.5}>
                <Typography variant='subtitle2' fontWeight={600}>
                  {devTokensToSend}
                </Typography>
                <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />
              </Stack>
            </Stack>
          </Stack>
        </Card>
        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <Button variant='outlined' onClick={onClose} color='secondary' disabled={isLoading}>
            Cancel
          </Button>
          <Tooltip title={!paymentPeriod ? 'Select a period' : ''}>
            <span>
              <Button
                variant='contained'
                disabled={paymentMonths === 0 || !paymentPeriod}
                loading={isLoading}
                onClick={onUpgrade}
              >
                Upgrade
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Modal>
  );
}
