import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import type { ModalProps } from 'components/common/Modal';
import { CanvasQRCode } from 'components/settings/account/components/otp/components/CanvasQrCode';

export function FarcasterLoginModal({ url, ...props }: Omit<ModalProps, 'children'> & { url?: string }) {
  return (
    <Modal open={props.open && !!url} onClose={props.onClose} title='Sign in with Warpcast' data-test='farcaster-modal'>
      <Typography variant='body1'>Scan with your phone's camera to continue.</Typography>
      <Box display='flex' justifyContent='center' my={2}>
        <CanvasQRCode uri={url || ''} />
      </Box>
      <Button href={url} external variant='text' sx={{ p: 0 }}>
        I'm using my phone →
      </Button>
    </Modal>
  );
}
