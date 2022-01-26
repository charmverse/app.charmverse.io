import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import styled from '@emotion/styled';
import PrimaryButton from 'components/common/PrimaryButton';

import splashImage from 'public/images/charmverse_world.png';

export const Container = styled(Box)`
  max-width: 100%;
  width: 1170px;
  margin: 0 auto;
`;

export default function SplashImage () {
  return (
    <>
      <Container px={3}>
        <Grid container>
          <Grid item xs={12} display={{ xs: 'flex', sm: 'none' }} justifyContent='center' py={3} px={6}>
            <Box sx={{ maxWidth: 300 }}>
              <Image src={splashImage} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} display='flex' justifyContent='center'>
            <Box>
              <Typography sx={{ fontSize: { xs: 30, md: 48 }, fontWeight: 'bold', lineHeight: '1.1em', mt: { xs: 3, md: '140px' }, mb: 3 }}>
                First Web 3 Native<br />
                All-in-one Workspace
              </Typography>
              <Typography sx={{ fontSize: 20, mb: 6 }}>
                Tasks, docs, and more
              </Typography>
              <PrimaryButton size='large' href={`/charmverse`}>Connect Wallet</PrimaryButton>
            </Box>
          </Grid>
          <Grid item display={{ xs: 'none', sm: 'flex' }} sm={6} alignItems='center'>
            <Box px={3}>
              <Image src={splashImage} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}