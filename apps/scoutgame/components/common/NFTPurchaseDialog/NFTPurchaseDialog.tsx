'use client';

import { useSmScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { Dialog } from 'components/common/Dialog';
import { usePurchase } from 'components/layout/PurchaseProvider';

import type { NFTPurchaseProps } from './components/NFTPurchaseForm';
import { NFTPurchaseForm } from './components/NFTPurchaseForm';

import '@rainbow-me/rainbowkit/styles.css';

type NFTPurchaseDialogProps = {
  open: boolean;
  onClose: VoidFunction;
  builder: NFTPurchaseProps['builder'];
};

// This component opens the wallet connect modal if the user is not connected yet
function NFTPurchaseDialogComponent(props: NFTPurchaseDialogProps) {
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address } = useAccount();
  const isDesktop = useSmScreen();
  // we need to keep track of this so we can close the modal when the user cancels
  const [isRainbowKitOpen, setIsRainbowKitOpen] = useState(false);

  const { clearPurchaseSuccess } = usePurchase();

  function onClose() {
    clearPurchaseSuccess();
    props.onClose();
  }

  // open Rainbowkit modal if not connected
  useEffect(() => {
    // If rainbowkit modal was closed by user, but our state is not updated yet, update it so we reset the parent open state
    if (!connectModalOpen && isRainbowKitOpen && !address) {
      setIsRainbowKitOpen(false);
      onClose();
    } else if (props.open && !address) {
      openConnectModal?.();
      setIsRainbowKitOpen(true);
    }
  }, [props.open, address, connectModalOpen, openConnectModal, isRainbowKitOpen]);

  return (
    <Dialog
      fullScreen={!isDesktop}
      open={props.open && !!address}
      onClose={onClose}
      title={`Scout ${props.builder.displayName}`}
      maxWidth='md'
    >
      <NFTPurchaseForm builder={props.builder} />
    </Dialog>
  );
}

export function NFTPurchaseDialog(props: NFTPurchaseDialogProps) {
  return (
    <RainbowKitProvider>
      <NFTPurchaseDialogComponent {...props} />
    </RainbowKitProvider>
  );
}
