import MoreHoriz from '@mui/icons-material/MoreHoriz';
import type { ListItemProps } from '@mui/material';
import { Menu, IconButton, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import type { IdentityType } from '@prisma/client';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { IdentityIcon } from 'components/profile/components/IdentityIcon';

interface IdentityProviderItemProps extends ListItemProps {
  text?: string;
  type: IdentityType;
  loading?: boolean;
  disabled?: boolean;
  connected?: boolean;
  error?: ReactNode;
  actions?: ReactNode;
}

export default function IdentityProviderItem({
  text,
  type,
  loading = false,
  disabled = false,
  connected = false,
  error,
  actions
}: IdentityProviderItemProps) {
  const identityMenuState = usePopupState({ variant: 'popover', popupId: `identity-menu-${type}` });

  return (
    <ListItem
      disableGutters
      secondaryAction={
        <IconButton
          aria-label={`Open ${type} identity options`}
          disabled={disabled || loading}
          {...bindTrigger(identityMenuState)}
        >
          <MoreHoriz />
        </IconButton>
      }
    >
      <ListItemIcon>
        <IdentityIcon type={type} />
      </ListItemIcon>
      <ListItemText
        primaryTypographyProps={{ ml: 1, noWrap: true }}
        primary={connected ? text || `Connected with ${type}` : `Connect with ${type}`}
      />
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
      <LoadingComponent isLoading={loading} size={15} />
      {error}
    </ListItem>
  );
}
