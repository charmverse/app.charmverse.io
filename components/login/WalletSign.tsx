import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import PrimaryButton from 'components/common/PrimaryButton';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { useContext, useEffect, useState } from 'react';
import { lowerCaseEqual } from 'lib/utilities/strings';
import { Web3Connection } from '../_app/Web3ConnectionManager';

interface Props {
  signSuccess: (authSig: AuthSig) => void;
  buttonText?: string;
}

export function WalletSign ({ signSuccess, buttonText }: Props) {

  const { account, sign, getStoredSignature } = useWeb3AuthSig();
  const { openWalletSelectorModal, triedEager, isWalletSelectorModalOpen } = useContext(Web3Connection);
  const [signatureFailed, setSignatureFailed] = useState(false);
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
      setIsSigning(true);
      setUserClickedConnect(false);
      sign()
        .then(signSuccess)
        .catch(() => setSignatureFailed(true))
        .finally(() => setIsSigning(false));
    }
  }, [userClickedConnect, account]);

  async function generateWalletAuth () {
    setIsSigning(true);
    setSignatureFailed(false);
    sign()
      .then(signSuccess)
      .catch(err => setSignatureFailed(true))
      .finally(() => setIsSigning(false));
  }

  if (!account) {
    return (
      <PrimaryButton sx={{ width: { xs: '100%', sm: 'auto' } }} size='large' loading={!triedEager} onClick={openWalletSelectorModal}>
        Connect Wallet
      </PrimaryButton>
    );
  }

  return (
    <Box>
      {signatureFailed && (
        <Alert severity='warning'>Wallet signature failed. Please try again</Alert>
      )}

      <PrimaryButton onClick={generateWalletAuth} loading={isSigning}>{buttonText ?? 'Verify wallet'}</PrimaryButton>
    </Box>
  );
}
