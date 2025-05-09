import MenuIcon from '@mui/icons-material/Menu';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import type { ListItemProps } from '@mui/material';
import { Menu, IconButton, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

interface SettingsItemProps extends ListItemProps {
  text?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}

export function SettingsItem({
  text,
  disabled = false,
  hidden = false,
  actions,
  children,
  sx,
  ...restProps
}: SettingsItemProps) {
  const identityMenuState = usePopupState({ variant: 'popover', popupId: `identity-menu-${text}` });

  return (
    <ListItem
      sx={{
        justifyContent: 'space-between',
        gap: 1,
        cursor: disabled ? '' : 'grab',
        opacity: disabled ? 0.5 : 1,
        ...sx
      }}
      disablePadding
      disableGutters
      secondaryAction={
        !!actions && (
          <IconButton
            aria-label='Open identity options'
            size='small'
            disabled={disabled}
            {...bindTrigger(identityMenuState)}
          >
            <MoreHoriz color='secondary' fontSize='small' />
          </IconButton>
        )
      }
      {...restProps}
    >
      <ListItemIcon sx={{ opacity: hidden ? 0.5 : 1 }}>
        <MenuIcon fontSize='small' />
      </ListItemIcon>
      <ListItemText primary={text} sx={{ opacity: hidden ? 0.5 : 1 }} />
      {children}
      <Menu
        {...bindMenu(identityMenuState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        onClick={identityMenuState.close}
      >
        {actions}
      </Menu>
    </ListItem>
  );
}
