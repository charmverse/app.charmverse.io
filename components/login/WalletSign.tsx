import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/system';
import PrimaryButton from 'components/common/PrimaryButton';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { lowerCaseEqual } from 'lib/utilities/strings';
import { useContext, useEffect, useState } from 'react';
import { Web3Connection } from '../_app/Web3ConnectionManager';

/**
 * @autoReuseSignature Set to true so that
 */
interface Props {
  signSuccess: (authSig: AuthSig) => void;
  buttonText?: string;
  buttonStyle?: SxProps<Theme>;
  buttonSize?: 'small' | 'medium' | 'large';
}

export function WalletSign ({ signSuccess, buttonText, buttonStyle, buttonSize }: Props) {

  const { account, sign, getStoredSignature, walletAuthSignature } = useWeb3AuthSig();
  const { openWalletSelectorModal, triedEager, isWalletSelectorModalOpen } = useContext(Web3Connection);
  const { showMessage } = useSnackbar();
  const [isSigning, setIsSigning] = useState(false);

  // We want to avoid auto-firing the sign workflow if the user is already with a connected wallet
  const [userClickedConnect, setUserClickedConnect] = useState(false);

  useEffect(() => {
    if (isWalletSelectorModalOpen) {
      setUserClickedConnect(true);
    }
  }, [isWalletSelectorModalOpen]);

  useEffect(() => {
    if (userClickedConnect && account && !lowerCaseEqual(getStoredSignature(account)?.address as string, account)) {
      setUserClickedConnect(false);
      generateWalletAuth();
    }
  }, [userClickedConnect, account]);

  async function generateWalletAuth () {
    setIsSigning(true);

    if (account && walletAuthSignature && lowerCaseEqual(walletAuthSignature.address, account)) {
      signSuccess(walletAuthSignature);
      setIsSigning(false);
    }
    else {
      sign()
        .then(signSuccess)
        .catch(() => showMessage('Wallet signature failed', 'warning'))
        .finally(() => setIsSigning(false));
    }
  }

  if (!account) {
    return (
      <PrimaryButton sx={buttonStyle} size={buttonSize ?? 'large'} loading={!triedEager} onClick={openWalletSelectorModal}>
        Connect Wallet
      </PrimaryButton>
    );
  }

  return (
    <PrimaryButton sx={buttonStyle} size={buttonSize ?? 'large'} onClick={generateWalletAuth} loading={isSigning}>{buttonText ?? 'Verify wallet'}</PrimaryButton>
  );
}
