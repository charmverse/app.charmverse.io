import { Box, Link, Typography } from '@mui/material';
import Image from 'next/image';

export function Footer() {
  return (
    <Box width='100%' component='footer' textAlign='center' bgcolor='grey.200' mx='auto' p={1}>
      <Typography component='span' mr={0.5}>
        Powered by
      </Typography>
      <Link href='https://charmverse.io' target='_blank' rel='noopener'>
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
