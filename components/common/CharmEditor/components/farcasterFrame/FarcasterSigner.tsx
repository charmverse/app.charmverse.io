import styled from '@emotion/styled';
import { Box, Stack, SvgIcon, Typography, darken } from '@mui/material';
import { useAccount } from 'wagmi';

import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { CanvasQRCode } from 'components/settings/account/components/otp/components/CanvasQrCode';
import { useFarcasterUser } from 'hooks/useFarcasterUser';
import FarcasterIcon from 'public/images/logos/farcaster.svg';

const StyledButton = styled(Button)`
  background-color: #855dcd;
  &:hover {
    background-color: ${darken('#855DCD', 0.1)};
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
          <Box display='flex' justifyContent='center' my={2}>
            {farcasterUser.signerApprovalUrl && <CanvasQRCode uri={farcasterUser.signerApprovalUrl} />}
          </Box>
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
