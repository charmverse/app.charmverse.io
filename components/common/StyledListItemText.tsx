import { ListItemText, ListItemTextProps } from '@mui/material';

export function StyledListItemText (props: ListItemTextProps) {
  return (
    <ListItemText
      primaryTypographyProps={{
        fontWeight: 500
      }}
      secondaryTypographyProps={{
        sx: { whiteSpace: 'normal' }
      }}
      {...props}
    />
  );
}
