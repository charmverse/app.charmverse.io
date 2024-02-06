import { Stack, SvgIcon, Typography, darken } from '@mui/material';
import { useAccount } from 'wagmi';

import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { CanvasQRCode } from 'components/settings/account/components/otp/components/CanvasQrCode';
import { useFarcasterFrame } from 'hooks/useFarcasterFrame';
import FarcasterIcon from 'public/images/logos/farcaster.svg';

import { FarcasterMiniProfile } from './FarcasterMiniProfile';

export function FarcasterSigner() {
  const { address } = useAccount();
  const { farcasterUser, startFarcasterSignerProcess, isLoadingFarcasterUser } = useFarcasterFrame();
  if (!address) {
    return <OpenWalletSelectorButton label='Connect your wallet' />;
  }

  if (farcasterUser?.status === 'approved') {
    return <FarcasterMiniProfile />;
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
            <CanvasQRCode uri={farcasterUser.signerApprovalUrl} size={250} />
          </>
        )}
      </Stack>
    );
  } else if (!farcasterUser?.status) {
    return (
      <Stack gap={1} alignItems='center'>
        <Button
          size='large'
          variant={!address ? 'outlined' : 'contained'}
          sx={{
            p: 1.5,
            width: 'fit-content',
            backgroundColor: '#855DCD',
            '&:hover': {
              backgroundColor: darken('#855DCD', 0.1)
            },
            display: 'flex',
            gap: 1,
            justifyContent: 'center'
          }}
          onClick={startFarcasterSignerProcess}
          loading={isLoadingFarcasterUser}
        >
          <SvgIcon viewBox='0 0 20 20' fontSize='small'>
            <FarcasterIcon />
          </SvgIcon>
          <Typography fontWeight={600} variant='body2'>
            {isLoadingFarcasterUser ? 'Loading...' : 'Sign in with Farcaster'}
          </Typography>
        </Button>
      </Stack>
    );
  }

  return null;
}
