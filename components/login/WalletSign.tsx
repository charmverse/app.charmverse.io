import type { SxProps, Theme } from '@mui/system';
import { useContext, useEffect, useState, useRef } from 'react';

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
  buttonSize?: 'small' | 'medium' | 'large';
}

export function WalletSign ({ signSuccess, buttonStyle, buttonSize }: Props) {

  const { account, sign, getStoredSignature, walletAuthSignature } = useWeb3AuthSig();
  const { openWalletSelectorModal, triedEager, isWalletSelectorModalOpen } = useContext(Web3Connection);
  const { showMessage } = useSnackbar();
  const [isSigning, setIsSigning] = useState(false);

  // We want to avoid auto-firing the sign workflow if the user is already with a connected wallet
  const userClickedConnect = useRef<boolean>(false);

  useEffect(() => {
    if (isWalletSelectorModalOpen && !userClickedConnect.current) {
      userClickedConnect.current = true;
    }
  }, [isWalletSelectorModalOpen]);

  useEffect(() => {
    if (userClickedConnect.current && !isSigning && account && !lowerCaseEqual(getStoredSignature(account)?.address as string, account)) {
      userClickedConnect.current = false;
      generateWalletAuth();
    }
  }, [account]);

  async function generateWalletAuth () {
    if (isSigning) {
      return;
    }

    setIsSigning(true);

    if (account && walletAuthSignature && lowerCaseEqual(walletAuthSignature.address, account)) {

      signSuccess(walletAuthSignature);
      setIsSigning(false);
    }
    else {

      sign()
        .then(signSuccess)
        .catch(error => {
          log.error('Error requesting wallet signature', error);
          showMessage('Wallet signature failed', 'warning');
        })
        .finally(() => setIsSigning(false));
    }
  }

  if (!account) {
    return (
      <PrimaryButton data-test='connect-wallet-button' sx={buttonStyle} size={buttonSize ?? 'large'} loading={!triedEager} onClick={openWalletSelectorModal}>
        Connect Wallet
      </PrimaryButton>
    );
  }

  return (
    <PrimaryButton data-test='verify-wallet-button' sx={buttonStyle} size={buttonSize ?? 'large'} onClick={generateWalletAuth} loading={isSigning}>
      Verify wallet
    </PrimaryButton>
  );
}
