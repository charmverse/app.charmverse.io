import { MoreHoriz } from '@mui/icons-material';
import type { MenuProps } from '@mui/material';
import { IconButton, Menu } from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

export type ContextMenuProps = Pick<MenuProps, 'anchorOrigin' | 'transformOrigin'> & {
  popupId: string;
  children: ReactNode;
};

export function ContextMenu({ popupId, children, ...menuProps }: ContextMenuProps) {
  const popupState = usePopupState({ variant: 'popover', popupId });

  return (
    <>
      <IconButton size='small' {...bindTrigger(popupState)}>
        <MoreHoriz fontSize='small' />
      </IconButton>
      <Menu {...bindMenu(popupState)} onClick={popupState.close} {...menuProps}>
        {children}
      </Menu>
    </>
  );
}
