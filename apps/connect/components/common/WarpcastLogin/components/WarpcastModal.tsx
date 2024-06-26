'use client';

import { CanvasQRCode } from '@connect/components/common/CanvasQrCode';
import { Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Link } from '@mui/material';
import type { DialogProps } from '@mui/material/Dialog';

export function FarcasterLoginModal({ url, ...props }: Omit<DialogProps, 'children'> & { url?: string }) {
  return (
    <Dialog open={props.open && !!url} onClose={props.onClose} title='Sign in with Warpcast'>
      <DialogTitle>Sign in with Warpcast</DialogTitle>
      <DialogContent>
        <DialogContentText variant='body1'>Scan with your phone's camera to continue.</DialogContentText>
        <CanvasQRCode uri={url || ''} />
        <DialogActions sx={{ justifyContent: 'start' }}>
          <Link href={url} sx={{ p: 0 }}>
            I'm using my phone →
          </Link>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
