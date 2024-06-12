import { QRCode } from '@farcaster/auth-kit';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import type { ModalProps } from 'components/common/Modal';

export function FarcasterLoginModal({ url, ...props }: Omit<ModalProps, 'children'> & { url?: string }) {
  return (
    <Modal open={props.open && !!url} onClose={props.onClose} title='Sign in with Warpcast'>
      <Typography variant='body1'>Scan with your phone's camera to continue.</Typography>
      <Box display='flex' justifyContent='center' my={2}>
        <QRCode uri={url || ''} size={340} />
      </Box>
      <Button href={url} variant='text' sx={{ p: 0 }}>
        I'm using my phone →
      </Button>
    </Modal>
  );
}
