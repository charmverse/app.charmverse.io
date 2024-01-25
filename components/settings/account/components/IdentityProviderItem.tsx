import type { IdentityType } from '@charmverse/core/prisma';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import type { ListItemProps } from '@mui/material';
import { Chip, Box, Menu, IconButton, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';

interface IdentityProviderItemProps extends ListItemProps {
  text?: string;
  type: IdentityType;
  loading?: boolean;
  disabled?: boolean;
  connected?: boolean;
  primary?: boolean;
  error?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export default function IdentityProviderItem({
  text,
  type,
  loading = false,
  disabled = false,
  connected = false,
  primary = false,
  error,
  actions,
  children
}: IdentityProviderItemProps) {
  const identityMenuState = usePopupState({ variant: 'popover', popupId: `identity-menu-${type}` });

  const typeLabel = type !== 'VerifiedEmail' ? type : 'Email';

  return (
    <ListItem
      sx={{ justifyContent: 'space-between', gap: 1 }}
      disableGutters
      secondaryAction={
        !!actions && (
          <IconButton
            aria-label={`Open ${type} identity options`}
            disabled={disabled || loading}
            {...bindTrigger(identityMenuState)}
          >
            <MoreHoriz />
          </IconButton>
        )
      }
    >
      <Box display='flex' alignItems='center' flex={1} justifyContent='space-between'>
        <Box display='flex' alignItems='center'>
          <ListItemIcon>
            <IdentityIcon type={type} />
          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{ ml: 1 }}
            primary={connected ? text || `Connected with ${typeLabel}` : text || `Connect with ${typeLabel}`}
          />
          {primary && <Chip size='small' sx={{ ml: 1 }} label='Primary' variant='outlined' />}
        </Box>

        <Box px={1}>
          <LoadingComponent isLoading={loading} size={15} />
        </Box>
      </Box>

      {error}
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
