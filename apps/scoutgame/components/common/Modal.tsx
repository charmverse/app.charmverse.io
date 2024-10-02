import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import type { SxProps } from '@mui/material';
import { Box, IconButton, Typography, Paper, Dialog, DialogContent, DialogTitle } from '@mui/material';
import type { DialogProps } from '@mui/material/Dialog';
import type { ReactNode } from 'react';

export function BasicModal({
  children,
  ...props
}: Omit<DialogProps, 'children' | 'onClose'> & {
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <Dialog {...props}>
      {props.title && (
        <DialogTitle>
          <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
            <Typography variant='h6' color='secondary'>
              {props.title}
            </Typography>
            {props.onClose && (
              <IconButton data-test='close-modal' onClick={props.onClose} sx={{ p: 0 }}>
                <HighlightOffIcon color='primary' />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
