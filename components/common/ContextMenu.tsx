import { MoreHoriz } from '@mui/icons-material';
import { Box, IconButton, Menu } from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

export type ContextMenuProps = {
  popupId: string;
  children: ReactNode;
};

export function ContextMenu({ popupId, children }: ContextMenuProps) {
  const popupState = usePopupState({ variant: 'popover', popupId });

  return (
    <>
      <Menu {...bindMenu(popupState)} onClick={popupState.close}>
        {children}
      </Menu>
      <Box display='flex' gap={2} alignItems='center'>
        <IconButton size='small' {...bindTrigger(popupState)}>
          <MoreHoriz fontSize='small' />
        </IconButton>
      </Box>
    </>
  );
}
