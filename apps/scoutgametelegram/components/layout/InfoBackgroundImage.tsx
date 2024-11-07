import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

export function InfoBackgroundImage(props: BoxProps) {
  return (
    <Box
      height='100vh'
      width='100%'
      zIndex={0}
      position='absolute'
      top={0}
      left={0}
      sx={{
        backgroundImage: {
          xs: 'url(/images/mobile_login_background.png)',
          md: 'url(/images/desktop_login_background.png)'
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      {...props}
    />
  );
}
