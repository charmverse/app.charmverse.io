import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

export function InfoBackgroundImage(props: BoxProps) {
  return (
    <Box
      height='100%'
      width='100%'
      zIndex={0}
      position='absolute'
      top={0}
      left={0}
      sx={{
        backgroundImage: {
          xs: 'url(/images/mobile_login_background.jpg)',
          md: 'url(/images/desktop_login_background.jpg)'
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      {...props}
    />
  );
}
