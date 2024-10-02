'use client';

import { useConnectModal, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

import { Dialog } from 'components/common/Dialog';
import { useSmScreen } from 'hooks/useMediaScreens';
import type { MinimalUserInfo } from 'lib/users/interfaces';

import { NFTPurchaseForm } from './components/NFTPurchaseForm';

import '@rainbow-me/rainbowkit/styles.css';

type NFTPurchaseDialogProps = {
  open: boolean;
  onClose: VoidFunction;
  builder: MinimalUserInfo & { price?: bigint; nftImageUrl?: string | null };
};

// This component opens the wallet connect modal if the user is not connected yet
function NFTPurchaseDialogComponent(props: NFTPurchaseDialogProps) {
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  const isDesktop = useSmScreen();

  // open Rainbowkit modal if not connected
  useEffect(() => {
    if (props.open && !address) {
      openConnectModal?.();
    }
  }, [props.open, address, openConnectModal]);

  return (
    <Dialog
      fullScreen={!isDesktop}
      open={props.open && !!address}
      onClose={props.onClose}
      title={`Scout @${props.builder.username}`}
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
