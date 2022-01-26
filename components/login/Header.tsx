import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import styled from '@emotion/styled';
import PrimaryButton from 'components/common/PrimaryButton';

import logoImage from 'public/images/charmverse_logo.webp';
import splashImage from 'public/images/charmverse_land.webp';

export default function Header () {
  return (
    <Box m={3}>
      <Image src={logoImage} alt='CharmVerse' />
    </Box>
  );
}