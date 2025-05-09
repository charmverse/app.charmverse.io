import CloseIcon from '@mui/icons-material/Close';
import type { DialogProps as MuiDialogProps } from '@mui/material';
import { Dialog as MuiDialog, DialogContent, DialogTitle, IconButton, DialogActions } from '@mui/material';
import type { ReactNode } from 'react';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useMdScreen } from 'hooks/useMediaScreens';

export type DialogProps = {
  onClose: () => void;
  title: string | ReactNode;
  footerActions?: ReactNode;
  children: ReactNode;
} & Omit<MuiDialogProps, 'title'>;

export function Dialog({ onClose, title, footerActions, children, ...props }: DialogProps) {
  const isMdScreen = useMdScreen();
  const isMobileDialog = !isMdScreen;

  if (isMobileDialog) {
    return (
      <MobileDialog title={title} onClose={onClose} footerActions={footerActions} {...props}>
        {children}
      </MobileDialog>
    );
  }

  return (
    <MuiDialog onClose={onClose} fullWidth maxWidth='sm' {...props}>
      {(!!title || !!onClose) && (
        <DialogTitle sx={{ m: 0, px: 3, pt: 3, pb: 2 }}>
          {title}

          {onClose && (
            <IconButton
              aria-label='close'
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 10
              }}
            >
              <CloseIcon color='secondary' />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent sx={{ px: 3, display: 'flex', direction: 'column', justifyContent: 'center', flexGrow: 1 }}>
        {children}
      </DialogContent>

      {!!footerActions && <DialogActions sx={{ m: 0, px: 3, py: 2 }}>{footerActions}</DialogActions>}
    </MuiDialog>
  );
}
