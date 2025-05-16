import { Stack, Typography } from '@mui/material';
import { UpgradableTiers, type UpgradableTier } from '@packages/lib/subscription/calculateSubscriptionCost';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useAccount } from 'wagmi';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import '@rainbow-me/rainbowkit/styles.css';

import { DowngradeTierModal } from './DowngradeTierModal';
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

  const { data: spaceReceipts = [], mutate: refreshSpaceReceipts } = useSWR(
    space ? `space-receipts/${space.id}` : null,
    () => (space ? charmClient.subscription.getSubscriptionContributions(space.id) : [])
  );

  const [isSendDevModalOpen, setIsSendDevModalOpen] = useState(false);
  const [isSpaceTierPurchaseModalOpen, setIsSpaceTierPurchaseModalOpen] = useState(false);
  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);
  const [isCancelTierModalOpen, setIsCancelTierModalOpen] = useState(false);
  const [isDowngradeTierModalOpen, setIsDowngradeTierModalOpen] = useState(false);

  return (
    <>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography>
          Space tier: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{space?.subscriptionTier}</span>
        </Typography>
      </Stack>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography>Space DEV balance: {spaceTokenBalance} </Typography>
        <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />
      </Stack>
      <SpaceSubscriptionReceiptsList spaceReceipts={spaceReceipts} />

      {address ? (
        <Stack flexDirection='row' alignItems='center' gap={0.5} mb={2}>
          <Button variant='contained' onClick={() => setIsSendDevModalOpen(true)} sx={{ width: 'fit-content' }}>
            Send DEV
          </Button>
          <Button
            variant='contained'
            onClick={() => setIsSpaceTierPurchaseModalOpen(true)}
            sx={{ width: 'fit-content' }}
          >
            Upgrade
          </Button>
          {space?.subscriptionCancelledAt !== null && space?.subscriptionTier !== 'free' ? (
            <Button variant='contained' onClick={() => setIsDowngradeTierModalOpen(true)} sx={{ width: 'fit-content' }}>
              Downgrade
            </Button>
          ) : null}
          {UpgradableTiers.includes(space?.subscriptionTier as UpgradableTier) && (
            <Button
              variant='outlined'
              color='error'
              onClick={() => setIsCancelTierModalOpen(true)}
              sx={{ width: 'fit-content' }}
            >
              Cancel
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
          refreshSpaceReceipts();
          refreshSpaceTokenBalance();
        }}
      />
      <SpaceSubscriptionUpgradeForm
        isOpen={isSpaceTierPurchaseModalOpen}
        onClose={() => setIsSpaceTierPurchaseModalOpen(false)}
        spaceTokenBalance={spaceTokenBalance}
        onSuccess={() => {
          refreshSpaceReceipts();
          refreshSpaceTokenBalance();
          setIsSpaceTierPurchaseModalOpen(false);
        }}
      />
      <CancelTierModal
        isOpen={isCancelTierModalOpen}
        onClose={() => setIsCancelTierModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
          setIsCancelTierModalOpen(false);
        }}
      />
      <DowngradeTierModal
        isOpen={isDowngradeTierModalOpen}
        onClose={() => setIsDowngradeTierModalOpen(false)}
        onSuccess={() => {
          refreshCurrentSpace();
          setIsDowngradeTierModalOpen(false);
        }}
      />
    </>
  );
}

function CancelTierModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) {
  const { space } = useCurrentSpace();

  const onConfirm = async () => {
    if (!space) {
      return;
    }

    await charmClient.subscription.cancelSubscription(space.id);
    onSuccess();
    onClose();
  };

  return (
    <ConfirmDeleteModal
      open={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      question='Are you sure you want to cancel your subscription?'
      title='Cancel current subscription'
      buttonText='Cancel'
    />
  );
}
