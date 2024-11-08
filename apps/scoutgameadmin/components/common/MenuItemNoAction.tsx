import type { TypographyProps } from '@mui/material';
import { ListItem, Typography } from '@mui/material';

export function MenuItemNoAction({ children, ...props }: { children: React.ReactNode } & TypographyProps) {
  return (
    <ListItem dense onClick={(e) => e.stopPropagation()}>
      <Typography color='text.secondary' variant='caption' {...props}>
        {children}
      </Typography>
    </ListItem>
  );
}
