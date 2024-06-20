'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import type { ModalProps } from '@mui/material/Modal';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';

import { CanvasQRCode } from 'components/common/CanvasQrCode';

export function FarcasterLoginModal({ url, ...props }: Omit<ModalProps, 'children'> & { url?: string }) {
  return (
    <Modal open={props.open && !!url} onClose={props.onClose} title='Sign in with Warpcast'>
      <>
        <Typography variant='body1'>Scan with your phone's camera to continue.</Typography>
        <Box display='flex' justifyContent='center' my={2}>
          <CanvasQRCode uri={url || ''} />
        </Box>
        <Link href={url} sx={{ p: 0 }}>
          I'm using my phone →
        </Link>
      </>
    </Modal>
  );
}
