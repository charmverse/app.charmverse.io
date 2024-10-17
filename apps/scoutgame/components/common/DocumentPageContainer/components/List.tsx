import type { ListItemButtonProps, ListItemProps, ListProps } from '@mui/material';
import { List as MUIList, ListItem as MUIListItem, ListItemButton as MUIListItemButton } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';
import type { ReactNode } from 'react';
import { forwardRef } from 'react';

// MUI list sucks on its own for some reason
export function List({
  children,
  listStyleType = 'disc',
  sx,
  ...restProps
}: PropsWithChildren<{ listStyleType?: 'decimal' | 'disc' } & ListProps>) {
  return (
    <MUIList sx={{ listStyleType, ml: 2, py: 0, ...sx }} dense {...restProps}>
      {children}
    </MUIList>
  );
}

export function ListItem({ children, sx, ...restProps }: PropsWithChildren<ListItemProps>) {
  return (
    <MUIListItem sx={{ display: 'list-item', ...sx }} {...restProps}>
      {children}
    </MUIListItem>
  );
}
