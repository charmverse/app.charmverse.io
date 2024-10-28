import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

export function SinglePageWrapper({ children, ...props }: BoxProps) {
  return (
    <Box
      position='relative'
      borderRadius={{ xs: 0, md: 2 }}
      border={{ xs: 'none', sm: '1px solid var(--charm-palette-divider)' }}
      maxWidth='500px'
      height='100%'
      textAlign='left'
      mx='auto'
      p={{ xs: 2, md: 3 }}
      {...props}
    >
      {children}
    </Box>
  );
}
