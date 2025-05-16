import { Alert, Stack, Typography } from '@mui/material';
import {
  SubscriptionTiers,
  UpgradableTiers,
  type UpgradableTier
} from '@packages/lib/subscription/calculateSubscriptionCost';
import { SubscriptionTierAmountRecord } from '@packages/lib/subscription/chargeSpaceSubscription';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { capitalize } from 'lodash';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useAccount } from 'wagmi';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import '@rainbow-me/rainbowkit/styles.css';

import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { DowngradeSubscriptionModal } from './DowngradeSubscriptionModal';
import { ReactivateSubscriptionModal } from './ReactivateSubscriptionModal';
import { SpaceContributionForm } from './SpaceContributionForm';
import { SpaceSubscriptionReceiptsList } from './SpaceSubscriptionReceipts';
import { SpaceSubscriptionUpgradeForm } from './SpaceSubscriptionUpgradeForm';

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

export function SpaceSubscription() {
  const { space, refreshCurrentSpace } = useCurrentSpace();
  const { address } = useAccount();

  const { data: spaceTokenBalance = 0, mutate: refreshSpaceTokenBalance } = useSWR(
    space ? `space-token-balance/${space.id}` : null,
    () => (space ? charmClient.spaces.getSpaceTokenBalance(space.id) : 0)
  );

  const { data: subscriptionReceipts = [], mutate: refreshSubscriptionReceipts } = useSWR(
    space ? `space-receipts/${space.id}` : null,
    () => (space ? charmClient.subscription.getSubscriptionReceipts(space.id) : [])
  );

  const { data: subscriptionEvents = [], mutate: refreshSubscriptionEvents } = useSWR(
    space ? `space-subscription-events/${space.id}` : null,
    () => (space ? charmClient.subscription.getSubscriptionEvents(space.id) : [])
  );

  const latestSubscriptionEvent = subscriptionEvents[0];

  const [isSendDevModalOpen, setIsSendDevModalOpen] = useState(false);
  const [isSpaceTierPurchaseModalOpen, setIsSpaceTierPurchaseModalOpen] = useState(false);
  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [isReactivateSubscriptionModalOpen, setIsReactivateSubscriptionModalOpen] = useState(false);
  const [isDowngradeSubscriptionModalOpen, setIsDowngradeSubscriptionModalOpen] = useState(false);

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

  return (
    <>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography>
          Tier: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{space?.subscriptionTier}</span>
        </Typography>
      </Stack>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography>DEV balance: {spaceTokenBalance} </Typography>
        <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />
      </Stack>
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
      <SpaceSubscriptionReceiptsList subscriptionReceipts={subscriptionReceipts} />

      {address ? (
        <Stack flexDirection='row' alignItems='center' gap={0.5} mb={2}>
          <Button
            disabled={isCancelled}
            variant='contained'
            onClick={() => setIsSendDevModalOpen(true)}
            sx={{ width: 'fit-content' }}
          >
            Send DEV
          </Button>
          <Button
            disabled={isCancelled}
            variant='contained'
            onClick={() => setIsSpaceTierPurchaseModalOpen(true)}
            sx={{ width: 'fit-content' }}
          >
            Upgrade
          </Button>
          {space?.subscriptionTier !== 'free' && space?.subscriptionTier !== 'readonly' && !isDowngraded ? (
            <Button
              disabled={isCancelled}
              variant='contained'
              onClick={() => setIsDowngradeSubscriptionModalOpen(true)}
              sx={{ width: 'fit-content' }}
            >
              Downgrade
            </Button>
          ) : null}
          {!isCancelled && UpgradableTiers.includes(space?.subscriptionTier as UpgradableTier) && (
            <Button
              variant='outlined'
              color='error'
              onClick={() => setIsCancelSubscriptionModalOpen(true)}
              sx={{ width: 'fit-content' }}
            >
              Cancel
            </Button>
          )}
          {isCancelled && (
            <Button
              variant='outlined'
              onClick={() => setIsReactivateSubscriptionModalOpen(true)}
              sx={{ width: 'fit-content' }}
            >
              Reactivate
            </Button>
          )}
        </Stack>
      ) : (
        <RainbowKitProvider>
          <ConnectWalletButton onClose={() => setIsConnectWalletModalOpen(false)} open={isConnectWalletModalOpen} />
        </RainbowKitProvider>
      )}
      <SpaceContributionForm
        isOpen={isSendDevModalOpen}
        onClose={() => setIsSendDevModalOpen(false)}
        onSuccess={() => {
          refreshSubscriptionReceipts();
          refreshSpaceTokenBalance();
        }}
      />
      <SpaceSubscriptionUpgradeForm
        isOpen={isSpaceTierPurchaseModalOpen}
        onClose={() => setIsSpaceTierPurchaseModalOpen(false)}
        spaceTokenBalance={spaceTokenBalance}
        onSuccess={() => {
          refreshSubscriptionReceipts();
          refreshSpaceTokenBalance();
          setIsSpaceTierPurchaseModalOpen(false);
        }}
      />
      <CancelSubscriptionModal
        isOpen={isCancelSubscriptionModalOpen}
        onClose={() => setIsCancelSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
          setIsCancelSubscriptionModalOpen(false);
        }}
      />
      <DowngradeSubscriptionModal
        isOpen={isDowngradeSubscriptionModalOpen}
        onClose={() => setIsDowngradeSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
          refreshSubscriptionEvents();
          setIsDowngradeSubscriptionModalOpen(false);
        }}
      />
      <ReactivateSubscriptionModal
        isOpen={isReactivateSubscriptionModalOpen}
        onClose={() => setIsReactivateSubscriptionModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
          setIsReactivateSubscriptionModalOpen(false);
        }}
      />
    </>
  );
}
