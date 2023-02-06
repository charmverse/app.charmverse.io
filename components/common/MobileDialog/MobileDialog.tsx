import styled from '@emotion/styled';
import type { DialogProps, SxProps, Theme } from '@mui/material';
import { DialogContent, Dialog, Slide } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import type { ReactNode } from 'react';
import { forwardRef } from 'react';

import { MobileDialogTitle } from 'components/common/MobileDialog/MobileDialogTitle';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}));

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />;
});

type Props = {
  title?: ReactNode | null;
  rightActions?: ReactNode;
  contentSx?: SxProps<Theme>;
} & Omit<DialogProps, 'title'>;

export function MobileDialog({ children, title, rightActions, onClose, contentSx, ...dialogProps }: Props) {
  const hasTitle = typeof title !== 'undefined' && title !== null;

  return (
    <StyledDialog fullScreen {...dialogProps} TransitionComponent={Transition} onClose={onClose} sx={{ padding: 0 }}>
      {hasTitle && <MobileDialogTitle title={title} rightActions={rightActions} onClose={onClose as VoidFunction} />}

      <DialogContent dividers sx={contentSx || { padding: 2 }}>
        {children}
      </DialogContent>
    </StyledDialog>
  );
}
