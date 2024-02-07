import styled from '@emotion/styled';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { Stack, SvgIcon, Typography } from '@mui/material';
import { useAccount } from 'wagmi';

import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { CanvasQRCode } from 'components/settings/account/components/otp/components/CanvasQrCode';
import { useFarcasterUser } from 'hooks/useFarcasterUser';
import FarcasterIcon from 'public/images/logos/farcaster.svg';

import { farcasterBrandColor, farcasterBrandColorDark } from './constants';

const StyledButton = styled(Button)`
  background-color: ${farcasterBrandColor};
  &:hover {
    background-color: ${farcasterBrandColorDark};
  }
  padding: ${({ theme }) => (theme.breakpoints.down('sm') ? theme.spacing(1) : theme.spacing(1.5))};
  width: fit-content;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-content: center;
`;

export function FarcasterSigner() {
  const { address } = useAccount();
  const {
    farcasterSignerModal,
    farcasterUser,
    startFarcasterSignerProcess,
    loading: isLoadingFarcasterUser
  } = useFarcasterUser();

  const warpcastClientDeeplink = farcasterUser?.signerApprovalUrl?.replace(
    'farcaster://',
    'https://client.warpcast.com/deeplinks/'
  );

  if (!address) {
    return <OpenWalletSelectorButton label='Connect your wallet' />;
  } else if (farcasterUser?.status === 'pending_approval') {
    return (
      <>
        <Stack alignItems='center' gap={2}>
          <StyledButton
            onClick={farcasterSignerModal.open}
            loading={isLoadingFarcasterUser || farcasterSignerModal.isOpen}
          >
            <SvgIcon viewBox='0 0 20 20' fontSize='small'>
              <FarcasterIcon />
            </SvgIcon>
            <Typography fontWeight={600} variant='body2'>
              {isLoadingFarcasterUser || farcasterSignerModal.isOpen
                ? 'Waiting for approval...'
                : 'Resume sign in with Farcaster'}
            </Typography>
          </StyledButton>
        </Stack>
        <Modal open={farcasterSignerModal.isOpen} onClose={farcasterSignerModal.close} title='Approve in Warpcast'>
          <Typography>Please scan the QR code and approve the request in your Farcaster app</Typography>
          {warpcastClientDeeplink && (
            <Stack my={1} alignItems='center'>
              <CanvasQRCode uri={warpcastClientDeeplink} />
              <Link href={warpcastClientDeeplink} target='_blank' rel='noreferrer'>
                <Stack flexDirection='row' gap={0.5} alignItems='center' justifyContent='center'>
                  <PhoneIphoneIcon fontSize='small' sx={{ fill: farcasterBrandColor }} />
                  <Typography color={farcasterBrandColor}>I'm using my phone</Typography>
                  <ArrowRightAltIcon fontSize='small' sx={{ fill: farcasterBrandColor }} />
                </Stack>
              </Link>
            </Stack>
          )}
        </Modal>
      </>
    );
  } else if (!farcasterUser?.status) {
    return (
      <Stack gap={1} alignItems='center'>
        <StyledButton onClick={startFarcasterSignerProcess} loading={isLoadingFarcasterUser}>
          <SvgIcon viewBox='0 0 20 20' fontSize='small'>
            <FarcasterIcon />
          </SvgIcon>
          <Typography fontWeight={600} variant='body2'>
            {isLoadingFarcasterUser ? 'Loading...' : 'Sign in with Farcaster'}
          </Typography>
        </StyledButton>
      </Stack>
    );
  }

  return null;
}
