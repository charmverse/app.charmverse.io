import { EditOff as EditOffIcon } from '@mui/icons-material';
import { Alert, Stack, Typography } from '@mui/material';
import {
  SubscriptionTiers,
  UpgradableTiers,
  type UpgradableTier
} from '@packages/lib/subscription/calculateSubscriptionCost';
import { SubscriptionTierAmountRecord } from '@packages/lib/subscription/chargeSpaceSubscription';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { capitalize } from 'lodash';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import charmClient from 'charmClient';
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
  onClickUpgrade,
  onClickSendDev
}: {
  spaceTokenBalance: number;
  subscriptionEvents: any[];
  onClickUpgrade: VoidFunction;
  onClickSendDev: VoidFunction;
}) {
  const { space, refreshCurrentSpace } = useCurrentSpace();
  const { address } = useAccount();

  const latestSubscriptionEvent = subscriptionEvents[0];

  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);

  const isCancelled = space?.subscriptionCancelledAt !== null;
  const currentTierIndex = space?.subscriptionTier ? SubscriptionTiers.indexOf(space?.subscriptionTier) : 0;
  const latestSubscriptionEventTierIndex = latestSubscriptionEvent?.newTier
    ? SubscriptionTiers.indexOf(latestSubscriptionEvent?.newTier)
    : 0;
  const isDowngraded = latestSubscriptionEventTierIndex < currentTierIndex;

  // Calculate how many months the current or downgraded tier will last
  let monthsLeft = 0;
  let tierToCheck = space?.subscriptionTier;
  if (isDowngraded && latestSubscriptionEvent?.newTier) {
    tierToCheck = latestSubscriptionEvent.newTier;
  }
  let tierPrice = 0;
  if (tierToCheck && typeof tierToCheck === 'string') {
    tierPrice = SubscriptionTierAmountRecord[tierToCheck] || 0;
  }
  if (tierPrice > 0 && spaceTokenBalance > 0) {
    monthsLeft = Math.floor(spaceTokenBalance / tierPrice);
  }

  const isReadOnly = tierToCheck === 'readonly';

  return (
    <>
      <Alert
        sx={{ display: 'flex', alignItems: 'center', '.MuiAlert-action': { p: 0 } }}
        icon={
          isReadOnly ? (
            <EditOffIcon sx={{ fontSize: 28 }} />
          ) : (
            <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={32} height={32} />
          )
        }
        severity={isReadOnly ? 'error' : 'info'}
        action={
          address ? (
            isReadOnly ? (
              <Button variant='contained' onClick={onClickUpgrade}>
                Upgrade now
              </Button>
            ) : (
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
        <Typography variant='h6'>Tier: {capitalize(tierToCheck || '')}</Typography>
        {tierToCheck && tierPrice > 0 && monthsLeft > 0 && (
          <Stack flexDirection='row' alignItems='center' gap={0.5}>
            <Typography>
              {capitalize(tierToCheck)} will last for{' '}
              <b>
                {monthsLeft} month{monthsLeft > 1 ? 's' : ''}
              </b>{' '}
              with your current balance.
            </Typography>
          </Stack>
        )}
        {isReadOnly && <Typography>Upgrade now to unlock editing</Typography>}
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
      {isDowngraded ? (
        <Alert severity='warning' variant='standard'>
          Your subscription is scheduled to be downgraded to {latestSubscriptionEvent?.newTier} at the beginning of next
          month.
        </Alert>
      ) : null}
    </>
  );
}
