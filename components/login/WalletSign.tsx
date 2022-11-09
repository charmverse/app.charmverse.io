import Alert from '@mui/material/Alert';
import type { SxProps, Theme } from '@mui/system';
import { useContext, useEffect, useState, useRef } from 'react';

import PrimaryButton from 'components/common/PrimaryButton';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig, AuthSigWithRawAddress } from 'lib/blockchain/interfaces';
import log from 'lib/log';
import { lowerCaseEqual } from 'lib/utilities/strings';

import { Web3Connection } from '../_app/Web3ConnectionManager';

interface Props {
  signSuccess: (authSig: AuthSigWithRawAddress) => void;
  buttonStyle?: SxProps<Theme>;
  ButtonComponent?: typeof PrimaryButton;
  buttonSize?: 'small' | 'medium' | 'large';
}

export function WalletSign ({ signSuccess, buttonStyle, buttonSize, ButtonComponent = PrimaryButton }: Props) {

  const {
    account,
    sign,
    isSigning,
    getStoredSignature,
    walletAuthSignature,
    verifiableWalletDetected,
    connectWallet,
    connectWalletModalIsOpen
  } = useWeb3AuthSig();
  const { isWalletSelectorModalOpen } = useContext(Web3Connection);
  const { showMessage } = useSnackbar();

  // We want to avoid auto-firing the sign workflow if the user is already with a connected wallet
  const userClickedConnect = useRef<boolean>(false);

  useEffect(() => {
    if (isWalletSelectorModalOpen && !userClickedConnect.current) {
      userClickedConnect.current = true;
    }
  }, [isWalletSelectorModalOpen]);

  useEffect(() => {
    if (userClickedConnect.current && !isSigning && verifiableWalletDetected) {
      userClickedConnect.current = false;
      generateWalletAuth();
    }
  }, [verifiableWalletDetected]);

  async function generateWalletAuth () {

    if (account && walletAuthSignature && lowerCaseEqual(walletAuthSignature.address, account)) {

      signSuccess({ ...walletAuthSignature, rawAddress: account });
    }
    else {
      sign()
        .then(signSuccess)
        .catch(error => {
          log.error('Error requesting wallet signature in login page', error);
          showMessage('Wallet signature failed', 'warning');
        });
    }
  }

  if (!verifiableWalletDetected) {
    return (
      <ButtonComponent
        data-test='connect-wallet-button'
        sx={buttonStyle}
        size={buttonSize ?? 'large'}
        loading={connectWalletModalIsOpen}
        onClick={() => {
          userClickedConnect.current = true;
          connectWallet();
        }}
      >
        Connect Wallet
      </ButtonComponent>
    );
  }

  return (
    <ButtonComponent data-test='verify-wallet-button' sx={buttonStyle} size={buttonSize ?? 'large'} onClick={generateWalletAuth} loading={isSigning}>
      Verify wallet
    </ButtonComponent>
  );
}
