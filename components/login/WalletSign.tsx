import { log } from '@charmverse/core/log';
import type { SxProps, Theme } from '@mui/material';
import { useEffect, useState } from 'react';

import PrimaryButton from 'components/common/PrimaryButton';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
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
    account,
    sign,
    isSigning,
    walletAuthSignature,
    verifiableWalletDetected,
    connectWallet,
    connectWalletModalIsOpen,
    isConnectingIdentity
  } = useWeb3AuthSig();
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
      sign()
        .then(signSuccess)
        .catch((error) => {
          log.error('Error requesting wallet signature in login page', error);
          showMessage('Wallet signature cancelled', 'info');
          onError?.(error);
        })
        .finally(() => {
          setIsVerifyingWallet(false);
        });
    }
  }

  if (!verifiableWalletDetected || isConnectingIdentity) {
    return (
      <ButtonComponent
        data-test='connect-wallet-button'
        sx={buttonStyle}
        size={buttonSize ?? 'large'}
        loading={connectWalletModalIsOpen || isConnectingIdentity}
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
