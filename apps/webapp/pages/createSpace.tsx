import { Box, Card, Grid, Typography } from '@mui/material';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import { CreateSpaceForm } from 'components/common/CreateSpaceForm/CreateSpaceForm';
import Image from 'components/common/Image';
import Footer from 'components/login/components/Footer';
import { Container } from 'components/login/components/LoginLayout';
import { useSpaces } from 'hooks/useSpaces';
import splashImage from 'public/images/artwork/world.png';

export default function CreateSpace() {
  const { spaces, isLoaded } = useSpaces();

  if (!spaces || !isLoaded) {
    return null;
  }

  return (
    <>
      <Container px={3} data-test='login-page-content'>
        <Grid container>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                sx={{
                  fontSize: { xs: 30, md: 48 },
                  fontWeight: 'bold',
                  lineHeight: '1.1em',
                  mt: 3,
                  mb: 6
                }}
              >
                Let's get started
              </Typography>
              <Card sx={{ p: 4, pt: 2 }}>
                <CreateSpaceForm submitText='Get Started' />
              </Card>
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image px={3} maxWidth={{ xs: 300, md: '100%' }} src={splashImage} />
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

CreateSpace.getLayout = getBaseLayout;
