import { log } from '@charmverse/core/log';
import type { SxProps, Theme } from '@mui/material';
import { useEffect, useState } from 'react';

import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import PrimaryButton from 'components/common/PrimaryButton';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { isTouchScreen } from 'lib/utilities/browser';
import { lowerCaseEqual } from 'lib/utilities/strings';

interface Props {
  signSuccess: (authSig: AuthSig) => void | Promise<any>;
  buttonStyle?: SxProps<Theme>;
  ButtonComponent?: typeof PrimaryButton;
  buttonSize?: 'small' | 'medium' | 'large';
  buttonOutlined?: boolean;
  // Verify Wallet will trigger signature as soon as a wallet is detected
  enableAutosign?: boolean;
  loading?: boolean;
  onError?: (err: any) => void;
}

export function useWalletSign({
  enableAutosign,
  loading,
  onError,
  signSuccess
}: {
  enableAutosign: boolean;
  onError?: (err: any) => void;
  loading?: boolean;
  signSuccess: (authSig: AuthSig) => void | Promise<any>;
}) {
  const { isConnectingIdentity, connectWallet, isWalletSelectorModalOpen } = useWeb3ConnectionManager();
  const { account, requestSignature, isSigning, walletAuthSignature, verifiableWalletDetected } = useWeb3Account();
  const { showMessage } = useSnackbar();
  const [isVerifyingWallet, setIsVerifyingWallet] = useState(false);
  const showLoadingState = loading || isSigning || isVerifyingWallet;

  useEffect(() => {
    // Do not trigger signature if user is on a mobile device
    if (!isTouchScreen() && !isSigning && enableAutosign && verifiableWalletDetected && !isConnectingIdentity) {
      generateWalletAuth();
    }
  }, [verifiableWalletDetected]);

  async function generateWalletAuth() {
    setIsVerifyingWallet(true);
    if (account && walletAuthSignature && lowerCaseEqual(walletAuthSignature.address, account)) {
      await signSuccess(walletAuthSignature);
      setIsVerifyingWallet(false);
    } else {
      requestSignature()
        .then(signSuccess)
        .catch((error) => {
          log.error('Error requesting wallet signature in login page', { error });
          showMessage(error?.message || 'Wallet signature cancelled', 'info');
          onError?.(error);
        })
        .finally(() => {
          setIsVerifyingWallet(false);
        });
    }
  }

  return {
    verifiableWalletDetected,
    isConnectingIdentity,
    connectWallet,
    isWalletSelectorModalOpen,
    generateWalletAuth,
    showLoadingState
  };
}

export function WalletSign({
  signSuccess,
  buttonStyle,
  buttonSize,
  ButtonComponent = PrimaryButton,
  buttonOutlined,
  enableAutosign,
  loading,
  onError
}: Props) {
  const {
    connectWallet,
    generateWalletAuth,
    isConnectingIdentity,
    isWalletSelectorModalOpen,
    showLoadingState,
    verifiableWalletDetected
  } = useWalletSign({
    enableAutosign: !!enableAutosign,
    loading,
    onError,
    signSuccess
  });

  if (!verifiableWalletDetected || isConnectingIdentity) {
    return (
      <ButtonComponent
        data-test='connect-wallet-button'
        sx={buttonStyle}
        size={buttonSize ?? 'large'}
        loading={isWalletSelectorModalOpen || isConnectingIdentity}
        onClick={() => {
          connectWallet();
        }}
        variant={buttonOutlined ? 'outlined' : undefined}
      >
        Connect Wallet
      </ButtonComponent>
    );
  }

  return (
    <ButtonComponent
      data-test='verify-wallet-button'
      sx={buttonStyle}
      size={buttonSize ?? 'large'}
      onClick={generateWalletAuth}
      loading={showLoadingState}
      variant={buttonOutlined ? 'outlined' : undefined}
    >
      Verify wallet
    </ButtonComponent>
  );
}
