import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

interface Props {
  onSuccess: () => void;
}

export function WalletSign ({ onSuccess }: Props) {

  const { account, sign } = useWeb3AuthSig();
  const [signatureFailed, setSignatureFailed] = useState(false);

  const [isSigning, setIsSigning] = useState(false);

  async function generateWalletAuth () {
    setIsSigning(true);
    setSignatureFailed(false);
    sign()
      .then(onSuccess)
      .catch(err => setSignatureFailed(true))
      .finally(() => setIsSigning(false));
  }

  if (!account) {
    return null;
  }

  return (
    <Box>
      <Typography variant='h2'>Sign your wallet</Typography>

      {signatureFailed && (
        <Alert severity='warning'>Wallet signature failed. Please try again</Alert>
      )}

      <Button onClick={generateWalletAuth} loading={isSigning}>Sign wallet</Button>
    </Box>
  );
}
