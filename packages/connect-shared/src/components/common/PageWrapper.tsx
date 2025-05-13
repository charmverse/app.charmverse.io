import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export function PageWrapper({
  children,
  header = null,
  footer = null,
  sx,
  ...restProps
}: BoxProps & { header?: ReactNode; footer?: ReactNode }) {
  return (
    <Box
      position='relative'
      borderRadius={{ xs: 0, md: 2 }}
      bgcolor='background.light'
      border={{ xs: 'none', md: '1px solid var(--charm-palette-divider)' }}
      maxWidth='700px'
      height='100%'
      mx='auto'
      {...restProps}
    >
      {header}
      <Box p={3} sx={sx}>
        {children}
      </Box>
      {footer}
    </Box>
  );
}
