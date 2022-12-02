import type { SxProps, Theme } from '@mui/system';
import { useContext, useEffect, useRef, useState } from 'react';

import PrimaryButton from 'components/common/PrimaryButton';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import log from 'lib/log';
import { lowerCaseEqual } from 'lib/utilities/strings';

import { Web3Connection } from '../_app/Web3ConnectionManager';

interface Props {
  signSuccess: (authSig: AuthSig) => void;
  buttonStyle?: SxProps<Theme>;
  ButtonComponent?: typeof PrimaryButton;
  buttonSize?: 'small' | 'medium' | 'large';
  buttonOutlined?: boolean;
  // If connecting a wallet, this component auto-triggers signing. Defaults to true
  enableAutosign?: boolean;
  loading?: boolean;
}

export function WalletSign({
  signSuccess,
  buttonStyle,
  buttonSize,
  ButtonComponent = PrimaryButton,
  buttonOutlined,
  enableAutosign = true,
  loading
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
  const { isWalletSelectorModalOpen } = useContext(Web3Connection);
  const { showMessage } = useSnackbar();

  // We want to avoid auto-firing the sign workflow if the user is already with a connected wallet
  const userClickedConnect = useRef<boolean>(false);

  const showLoadingState = loading || isSigning;

  useEffect(() => {
    if (isWalletSelectorModalOpen && !userClickedConnect.current) {
      userClickedConnect.current = true;
    }
  }, [isWalletSelectorModalOpen]);

  useEffect(() => {
    if (
      userClickedConnect.current &&
      !isSigning &&
      enableAutosign &&
      verifiableWalletDetected &&
      !isConnectingIdentity
    ) {
      userClickedConnect.current = false;
      generateWalletAuth();
    }
  }, [verifiableWalletDetected, isConnectingIdentity]);

  async function generateWalletAuth() {
    if (account && walletAuthSignature && lowerCaseEqual(walletAuthSignature.address, account)) {
      signSuccess(walletAuthSignature);
    } else {
      sign()
        .then(signSuccess)
        .catch((error) => {
          log.error('Error requesting wallet signature in login page', error);
          showMessage('Wallet signature failed', 'warning');
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
          userClickedConnect.current = true;
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
      disabled={showLoadingState}
      loading={showLoadingState}
      variant={buttonOutlined ? 'outlined' : undefined}
    >
      Verify wallet
    </ButtonComponent>
  );
}
