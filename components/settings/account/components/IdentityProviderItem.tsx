import type { IdentityType } from '@charmverse/core/prisma';
import type { ListItemProps } from '@mui/material';
import { Box, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import type { ReactNode } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';

interface IdentityProviderItemProps extends ListItemProps {
  text?: string;
  type: IdentityType;
  loading?: boolean;
  connected?: boolean;
  children?: ReactNode;
}

export default function IdentityProviderItem({
  text,
  type,
  loading = false,
  connected = false,
  children
}: IdentityProviderItemProps) {
  const typeLabel = type !== 'VerifiedEmail' ? type : 'Email';

  return (
    <ListItem sx={{ justifyContent: 'space-between', gap: 1 }} disableGutters>
      <Box display='flex' alignItems='center' flex={1} justifyContent='space-between'>
        <Box display='flex' alignItems='center'>
          <ListItemIcon>
            <IdentityIcon type={type} />
          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{ ml: 1 }}
            primary={connected ? text || `Connected with ${typeLabel}` : text || `Connect with ${typeLabel}`}
          />
        </Box>

        <Box px={1}>
          <LoadingComponent isLoading={loading} size={15} />
        </Box>
      </Box>
      {children}
    </ListItem>
  );
}
