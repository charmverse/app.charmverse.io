import { Stack, Typography } from '@mui/material';
import QRCode from 'qrcode.react';
import { useAccount } from 'wagmi';

import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useFarcasterFrame } from 'hooks/useFarcasterFrame';

export function FarcasterSigner() {
  const { address } = useAccount();
  const { farcasterUser, startFarcasterSignerProcess, isLoadingFarcasterUser } = useFarcasterFrame();
  if (!address) {
    return <OpenWalletSelectorButton label='Connect your wallet' />;
  }

  if (farcasterUser?.status === 'approved') {
    return (
      <Typography>{farcasterUser.fid ? `Signed in as ${farcasterUser?.fid}` : 'Something is wrong...'}</Typography>
    );
  } else if (farcasterUser?.status === 'pending_approval') {
    return (
      <Stack alignItems='center' gap={2}>
        <Typography variant='h5' fontWeight='bold'>
          Approve in Warpcast
        </Typography>
        <LoadingComponent minHeight={20} size={20} />
        {farcasterUser.signerApprovalUrl && (
          <>
            <Typography variant='body2'>Scan with your camera app</Typography>
            <QRCode value={farcasterUser.signerApprovalUrl} size={250} />
            <Typography variant='body2'>Or</Typography>
            <Button href={farcasterUser.signerApprovalUrl} target='_blank' rel='noopener noreferrer'>
              Open url
            </Button>
          </>
        )}
      </Stack>
    );
  } else if (!farcasterUser?.status) {
    return (
      <Stack gap={1}>
        <Button
          size='large'
          variant={!address ? 'outlined' : 'contained'}
          color={!address ? 'error' : 'primary'}
          onClick={startFarcasterSignerProcess}
          loading={isLoadingFarcasterUser}
        >
          {isLoadingFarcasterUser ? 'Loading...' : 'Sign in with farcaster'}
        </Button>
      </Stack>
    );
  }

  return null;
}
