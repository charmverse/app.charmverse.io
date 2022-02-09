import Box from '@mui/material/Box';
import Image from 'next/image';
import { useTheme } from '@emotion/react';

import darkLogoImage from 'public/images/charmverse_logo_sm_black.png';
import whiteLogoImage from 'public/images/charmverse_logo_sm_white.png';

export default function Header () {
  const theme = useTheme();
  const logo = theme.palette.mode === 'dark' ? whiteLogoImage : darkLogoImage;
  return (
    <Box m={3}>
      <Image src={logo} alt='CharmVerse' />
    </Box>
  );
}
