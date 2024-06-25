'use client';

import { CanvasQRCode } from '@connect/components/common/CanvasQrCode';
import Box from '@mui/material/Box';
import type { DialogProps } from '@mui/material/Dialog';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export function FarcasterLoginModal({ url, ...props }: Omit<DialogProps, 'children'> & { url?: string }) {
  return (
    <Dialog open={props.open && !!url} onClose={props.onClose} title='Sign in with Warpcast'>
      <DialogTitle>Sign in with Warpcast</DialogTitle>
      <Box px={3} pb={3}>
        <Typography variant='body1'>Scan with your phone's camera to continue.</Typography>
        <Box display='flex' justifyContent='center' my={2}>
          <CanvasQRCode uri={url || ''} />
        </Box>
        <Link href={url} sx={{ p: 0 }}>
          I'm using my phone →
        </Link>
      </Box>
    </Dialog>
  );
}
