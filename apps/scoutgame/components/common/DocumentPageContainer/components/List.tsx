import { List as MUIList, ListItem as MUIListItem } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

// MUI list sucks on its own for some reason
export function List({ children, listStyleType = 'disc' }: PropsWithChildren<{ listStyleType?: 'decimal' | 'disc' }>) {
  return (
    <MUIList sx={{ listStyleType, ml: 2, py: 0 }} dense>
      {children}
    </MUIList>
  );
}

export function ListItem({ children }: PropsWithChildren) {
  return <MUIListItem sx={{ display: 'list-item' }}>{children}</MUIListItem>;
}
