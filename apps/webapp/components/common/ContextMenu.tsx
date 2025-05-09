import { MoreHoriz } from '@mui/icons-material';
import type { MenuProps } from '@mui/material';
import { IconButton, Menu } from '@mui/material';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

export type ContextMenuProps = Pick<MenuProps, 'anchorOrigin' | 'transformOrigin'> & {
  iconColor?: 'secondary';
  iconSize?: 'small';
  popupId: string;
  children: ReactNode;
};

export function ContextMenu({ iconColor, iconSize, popupId, children, ...menuProps }: ContextMenuProps) {
  const popupState = usePopupState({ variant: 'popover', popupId });

  // Wrapping in a div ensures that IconButton is a full circle and not an oval in some flex situations
  return (
    <div>
      <IconButton size='small' {...bindTrigger(popupState)}>
        <MoreHoriz color={iconColor} fontSize={iconSize} />
      </IconButton>
      <Menu {...bindMenu(popupState)} onClick={popupState.close} {...menuProps}>
        {children}
      </Menu>
    </div>
  );
}
