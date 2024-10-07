import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';

export function SinglePageLayout({ children, ...props }: BoxProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        textAlign: 'center',
        height: '100%',
        minHeight: 'calc(100svh - 48px)'
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
