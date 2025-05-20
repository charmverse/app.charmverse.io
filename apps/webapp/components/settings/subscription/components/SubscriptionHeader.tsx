import type { Space, SpaceSubscriptionTierChangeEvent } from '@charmverse/core/prisma-client';
import { EditOff as EditOffIcon } from '@mui/icons-material';
import { Alert, Stack, Typography } from '@mui/material';
import { tierConfig, subscriptionTierOrder } from '@packages/subscriptions/constants';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

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

  return (
    <Button variant='contained' onClick={openConnectModal} sx={{ width: 'fit-content' }}>
      Connect Wallet
    </Button>
  );
}
export function SubscriptionHeader({
  spaceTokenBalance,
  subscriptionEvents,
  onClickSendDev
}: {
  spaceTokenBalance: number;
  subscriptionEvents?: SpaceSubscriptionTierChangeEvent[];
  onClickSendDev: VoidFunction;
}) {
  const { space, isLoading } = useCurrentSpace();
  const { address } = useAccount();
  const latestSubscriptionEvent = subscriptionEvents?.[0];

  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);

  const isCancelled = space?.subscriptionCancelledAt !== null;
  const currentTierIndex = space?.subscriptionTier ? subscriptionTierOrder.indexOf(space?.subscriptionTier) : 0;
  const latestSubscriptionEventTierIndex = latestSubscriptionEvent?.newTier
    ? subscriptionTierOrder.indexOf(latestSubscriptionEvent?.newTier)
    : 0;
  const isDowngraded = !isLoading && subscriptionEvents && latestSubscriptionEventTierIndex < currentTierIndex;

  // Calculate how many months the current tier will last
  let monthsLeft = 0;
  const currentTier = space?.subscriptionTier;
  const tierAfterDowngrade = isDowngraded && latestSubscriptionEvent?.newTier;
  const tierPrice = currentTier ? tierConfig[currentTier].tokenPrice : 0;
  if (tierPrice > 0 && spaceTokenBalance > 0) {
    monthsLeft = Math.floor(spaceTokenBalance / tierPrice);
  }
  const currentTierName = space?.subscriptionTier ? tierConfig[space.subscriptionTier]?.name : '';
  const isReadOnly = currentTier === 'readonly';

  return (
    <>
      <Alert
        sx={{ display: 'flex', alignItems: 'center', '.MuiAlert-action': { pt: 0, pr: 1 } }}
        icon={
          isReadOnly ? (
            <EditOffIcon sx={{ fontSize: 28 }} />
          ) : (
            <Image src={currentTier ? tierConfig[currentTier]?.iconPath : ''} alt='' width={48} height={48} />
          )
        }
        severity={isReadOnly ? 'error' : 'info'}
        action={
          address ? (
            currentTier === 'readonly' ||
            currentTier === 'free' ||
            tierAfterDowngrade === 'readonly' ||
            tierAfterDowngrade === 'free' ? null : (
              <Button
                startIcon={<Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />}
                variant='outlined'
                onClick={onClickSendDev}
              >
                Send DEV to space
              </Button>
            )
          ) : (
            <ConnectWalletButton onClose={() => setIsConnectWalletModalOpen(false)} open={isConnectWalletModalOpen} />
          )
        }
      >
        <Typography variant='h6'>Current Plan: {currentTierName}</Typography>
        {currentTierName && tierPrice > 0 && monthsLeft > 0 && (
          <Stack flexDirection='row' alignItems='center' gap={0.5}>
            <Typography>
              {currentTierName} will last for{' '}
              <b>
                {monthsLeft} month{monthsLeft > 1 ? 's' : ''}
              </b>{' '}
              with your current balance.
            </Typography>
          </Stack>
        )}
        {isReadOnly && <Typography>Select a tier below to unlock editing</Typography>}
      </Alert>
      {/* <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography>DEV balance: {spaceTokenBalance} </Typography>
        <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />
      </Stack> */}
      {isCancelled ? (
        <Alert severity='error' variant='standard'>
          Your subscription has been cancelled and will last until the space balance is depleted. You will not be able
          to send DEV tokens or upgrade your subscription.
        </Alert>
      ) : null}
      {tierAfterDowngrade ? (
        <Alert severity='warning' variant='standard'>
          Your subscription is scheduled to be downgraded to {tierConfig[tierAfterDowngrade]?.name} at the beginning of
          next month.
        </Alert>
      ) : null}
    </>
  );
}
