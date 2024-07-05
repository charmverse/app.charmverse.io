import { Box, Link, Typography } from '@mui/material';
import type { BoxProps } from '@mui/material/Box';
import Image from 'next/image';

export function Footer(props: BoxProps) {
  return (
    <Box
      component='footer'
      display='flex'
      gap={0.5}
      alignItems='center'
      justifyContent='center'
      bgcolor='grey.200'
      mx='auto'
      p={1}
      {...props}
    >
      <Typography component='span'>Powered by</Typography>
      <Link href='https://app.charmverse.io' target='_blank' rel='noopener'>
        <Image
          src='/images/charmverse-logo-black.webp'
          width={100}
          height={20}
          alt='CharmVerse'
          style={{ verticalAlign: 'middle' }}
        />
      </Link>
    </Box>
  );
}
