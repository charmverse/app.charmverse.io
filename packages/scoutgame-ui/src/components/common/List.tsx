import type { ListItemProps, ListProps } from '@mui/material';
import { List as MUIList, ListItem as MUIListItem } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

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
