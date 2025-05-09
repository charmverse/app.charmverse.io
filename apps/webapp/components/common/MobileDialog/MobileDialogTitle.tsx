import CloseIcon from '@mui/icons-material/Close';
import { Box, DialogTitle, IconButton, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type Props = {
  title?: ReactNode;
  onClose?: VoidFunction;
  rightActions?: ReactNode;
};

export function MobileDialogTitle({ title, onClose, rightActions }: Props) {
  return (
    <DialogTitle
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        pl: 2,
        pr: 1,
        py: 0.5,
        minHeight: '40px'
      }}
    >
      <>
        <Box display='flex' alignItems='center' overflow='hidden' gap={0.5}>
          {typeof title === 'string' ? (
            <Typography fontWeight={600} noWrap>
              {title}
            </Typography>
          ) : (
            title
          )}
        </Box>

        <Box display='flex' alignItems='center' gap={0.5}>
          {rightActions || null}
          {!!onClose && (
            <IconButton aria-label='close' onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </>
    </DialogTitle>
  );
}
