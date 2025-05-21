import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { EditOff as EditOffIcon } from '@mui/icons-material';
import { Alert, Stack, Typography } from '@mui/material';
import { subscriptionTierOrder, tierConfig } from '@packages/subscriptions/constants';
import type { SpaceSubscriptionStatus } from '@packages/subscriptions/getSubscriptionStatus';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { Button } from 'components/common/Button';

export function SubscriptionHeader({
  subscriptionStatus,
  onClickSendDev
}: {
  subscriptionStatus: SpaceSubscriptionStatus;
  onClickSendDev: VoidFunction;
}) {
  const {
    tokenBalance: { formatted: spaceTokenBalance },
    subscriptionCancelledAt,
    tier: currentTier,
    pendingTier,
    expiresAt,
    isReadonlyNextMonth
  } = subscriptionStatus;
  const { address } = useAccount();

  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);

  const isCancelled = !!subscriptionCancelledAt;
  const currentTierIndex = currentTier ? subscriptionTierOrder.indexOf(currentTier) : 0;
  const latestSubscriptionEventTierIndex = pendingTier ? subscriptionTierOrder.indexOf(pendingTier) : 0;
  const isDowngraded = pendingTier && latestSubscriptionEventTierIndex < currentTierIndex;

  // Calculate how many months the current tier will last
  const newTierAfterDowngrade = isDowngraded && pendingTier;
  const firstOfNextMonth = DateTime.utc().endOf('month').plus({ months: 1 }).startOf('month');
  const currentTierName = currentTier ? tierConfig[currentTier]?.name : '';
  const isReadonly = currentTier === 'readonly';
  // hide the send dev button if the space is expired (requiring an upgrade), is free, or has chosen to downgrade to free
  const hideSendDevButton =
    currentTier === 'readonly' || currentTier === 'free' || pendingTier === 'free' || !spaceTokenBalance;

  return (
    <>
      <Alert
        sx={{ display: 'flex', alignItems: 'flex-start', '.MuiAlert-action': { pt: 1, pr: 1 } }}
        icon={
          isReadonly ? (
            <EditOffIcon sx={{ fontSize: 28 }} />
          ) : (
            <Image src={currentTier ? tierConfig[currentTier]?.iconPath : ''} alt='' width={60} height={60} />
          )
        }
        severity={isReadonly || isReadonlyNextMonth ? 'error' : 'info'}
        action={
          hideSendDevButton ? null : address ? (
            <SendDevButton onClick={onClickSendDev} isConnected />
          ) : (
            <ConnectWalletButton onClose={() => setIsConnectWalletModalOpen(false)} open={isConnectWalletModalOpen} />
          )
        }
      >
        <Typography variant='h6'>Current Plan: {currentTierName}</Typography>
        <Typography>
          DEV Balance: <strong>{spaceTokenBalance.toLocaleString()}</strong>
        </Typography>
        {expiresAt && (
          <Stack flexDirection='row' alignItems='center' gap={0.5}>
            <Typography>
              Your plan will end on{' '}
              <b>{DateTime.fromISO(expiresAt).toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' })}</b>.
            </Typography>
          </Stack>
        )}
        {!isReadonly && isReadonlyNextMonth ? (
          <Typography variant='body2' sx={{ mt: 1 }}>
            Your subscription is scheduled to expire next month. You will still have readonly access to your content,
            but send DEV now to retain your current tier.
          </Typography>
        ) : null}
        {isReadonly && <Typography>Select a tier below to unlock editing</Typography>}
      </Alert>
      {isCancelled ? (
        <Alert severity='error' variant='standard'>
          Your subscription has been cancelled and will last until the space balance is depleted. You will not be able
          to send DEV tokens or upgrade your subscription.
        </Alert>
      ) : null}
      {!isReadonlyNextMonth && newTierAfterDowngrade ? (
        <Alert severity='warning' variant='standard'>
          Your subscription is scheduled to be downgraded to {tierConfig[newTierAfterDowngrade]?.name} on{' '}
          {firstOfNextMonth.toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' })}.
        </Alert>
      ) : null}
    </>
  );
}

function ConnectWalletButton({ onClose, open }: { onClose: VoidFunction; open: boolean }) {
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address } = useAccount();

  // we need to keep track of this so we can close the modal when the user cancels
  const [isRainbowKitOpen, setIsRainbowKitOpen] = useState(false);

  useEffect(() => {
    if (!connectModalOpen && isRainbowKitOpen && !address) {
      setIsRainbowKitOpen(false);
      onClose();
    } else if (open && !address) {
      openConnectModal?.();
      setIsRainbowKitOpen(true);
    }
  }, [open, onClose, address, connectModalOpen, openConnectModal, isRainbowKitOpen]);

  return <SendDevButton onClick={openConnectModal} />;
}

function SendDevButton({ onClick, isConnected }: { onClick?: VoidFunction; isConnected?: boolean }) {
  return (
    <Button
      startIcon={<Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />}
      variant='outlined'
      onClick={onClick}
    >
      {isConnected ? 'Send DEV to space' : 'Connect Wallet'}
    </Button>
  );
}
