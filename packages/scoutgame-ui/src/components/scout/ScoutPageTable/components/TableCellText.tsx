import type { TypographyProps } from '@mui/material';
import { Typography } from '@mui/material';

export function TableCellText({ ...props }: { children: React.ReactNode } & TypographyProps) {
  return <Typography noWrap fontSize={{ xs: '12px', md: '14px' }} {...props} />;
}
