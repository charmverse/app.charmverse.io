import type { ModalProps } from '@mui/material/Modal';
import MuiModal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import type { ReactNode } from 'react';

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

export function BasicModal({
  children,
  theme = 'light',
  ...props
}: Omit<ModalProps, 'children'> & { theme?: 'light' | 'dark' | 'system'; children: ReactNode }) {
  return (
    <MuiModal data-mui-color-scheme={theme} {...props}>
      <Paper sx={sx}>{children}</Paper>
    </MuiModal>
  );
}
