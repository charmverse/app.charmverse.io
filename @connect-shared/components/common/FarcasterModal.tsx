'use client';

import { CanvasQRCode } from '@connect-shared/components/common/CanvasQrCode';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import { Paper } from '@mui/material';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import type { ModalProps } from '@mui/material/Modal';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';

const sx = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  p: 4,
  border: 0,
  borderRadius: 3
};

export function FarcasterLoginModal({ url, ...props }: Omit<ModalProps, 'children'> & { url?: string }) {
  return (
    <Modal open={props.open && !!url} onClose={props.onClose} data-mui-color-scheme='light' data-test='farcaster-modal'>
      <Paper sx={sx}>
        <Typography variant='h6' fontWeight='bold'>
          Sign in with Farcaster
        </Typography>
        <Typography variant='body1' color='secondary'>
          Scan with your phone's camera to continue.
        </Typography>
        <Box display='flex' justifyContent='center' flexDirection='column' my={2} gap={2} alignItems='center' pt={2}>
          <CanvasQRCode uri={url || ''} />
          <Link
            href={url}
            sx={{ p: 0, alignItems: 'center', display: 'flex', '&:hover': { color: 'farcaster.main' } }}
            color='farcaster.main'
          >
            <PhoneAndroidIcon fontSize='small' />
            I'm using my phone →
          </Link>
        </Box>
      </Paper>
    </Modal>
  );
}
