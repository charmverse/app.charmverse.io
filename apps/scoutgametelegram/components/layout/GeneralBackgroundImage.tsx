import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

export function GeneralBackgroundImage(props: BoxProps) {
  return (
    <Box
      height='100%'
      width='100%'
      zIndex={-1}
      position='absolute'
      top={0}
      left={0}
      sx={{
        backgroundImage: 'url(/images/general-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      {...props}
    />
  );
}
