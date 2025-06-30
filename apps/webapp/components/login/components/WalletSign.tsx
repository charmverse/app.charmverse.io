import type { SxProps, Theme } from '@mui/material';
import { log } from '@packages/core/log';
import type { SignatureVerificationPayload } from '@packages/lib/blockchain/signAndVerify';
import { isTouchScreen } from '@packages/lib/utils/browser';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';

interface Props {
  signSuccess: (data: SignatureVerificationPayload) => Promise<any>;
  buttonStyle?: SxProps<Theme>;
  ButtonComponent?: typeof Button;
  buttonSize?: 'small' | 'medium' | 'large';
  buttonOutlined?: boolean;
  // Verify Wallet will trigger signature as soon as a wallet is detected
  enableAutosign?: boolean;
  loading?: boolean;
  onError?: (err: any) => void;
  children?: ReactNode | ((options: { needsVerification: boolean; isLoading: boolean }) => ReactNode);
  buttonColor?: 'primary' | 'secondary';
  onClick?: VoidFunction;
}

export function WalletSign({
  signSuccess,
  buttonStyle,
  buttonSize,
  ButtonComponent = Button,
  buttonOutlined,
  enableAutosign,
  buttonColor = 'primary',
  loading,
  onError,
  onClick,
  children
}: Props) {
  const { connectWallet, isWalletSelectorModalOpen } = useWeb3ConnectionManager();
  const { isSigning, requestSignature, verifiableWalletDetected } = useWeb3Account();
  const { showMessage } = useSnackbar();
  const [isVerifyingWallet, setIsVerifyingWallet] = useState(false);
  const showLoadingState = loading || isSigning || isVerifyingWallet;

  useEffect(() => {
    // Do not trigger signature if user is on a mobile device
    if (!isTouchScreen() && !isSigning && enableAutosign && verifiableWalletDetected) {
      generateWalletAuth();
    }
  }, [verifiableWalletDetected]);

  async function generateWalletAuth() {
    onClick?.();
    setIsVerifyingWallet(true);
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

  if (!verifiableWalletDetected) {
    return (
      <ButtonComponent
        data-test='connect-wallet-button'
        sx={buttonStyle}
        size={buttonSize ?? 'large'}
        loading={isWalletSelectorModalOpen}
        onClick={() => {
          onClick?.();
          connectWallet();
        }}
        variant={buttonOutlined ? 'outlined' : undefined}
        color={buttonColor}
      >
        {children
          ? typeof children === 'function'
            ? children({ needsVerification: false, isLoading: isWalletSelectorModalOpen })
            : children
          : 'Connect a wallet'}
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
      color={buttonColor}
    >
      {children
        ? typeof children === 'function'
          ? children({ needsVerification: true, isLoading: showLoadingState })
          : children
        : 'Verify wallet'}
    </ButtonComponent>
  );
}
