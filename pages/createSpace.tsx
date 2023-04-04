import { Box, Card, Grid, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import { CreateSpaceForm } from 'components/common/CreateSpaceForm/CreateSpaceForm';
import Image from 'components/common/Image';
import { Container } from 'components/login/components/LoginLayout';
import Footer from 'components/login/Footer';
import { useSpaces } from 'hooks/useSpaces';
import splashImage from 'public/images/artwork/world.png';

import { getDefaultWorkspaceUrl } from './index';

export default function CreateSpace() {
  const { spaces, isLoaded } = useSpaces();
  const router = useRouter();

  // useEffect(() => {
  //   if (spaces.length > 0) {
  //     router.push(getDefaultWorkspaceUrl(spaces));
  //   }
  // }, [spaces]);

  if (!spaces || !isLoaded) {
    return null;
  }

  return (
    <>
      <Container px={3} data-test='login-page-content'>
        <Grid container>
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: 'flex',
              justifyContent: {
                xs: 'center',
                md: 'flex-start'
              },
              mb: 2
            }}
          >
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                sx={{
                  fontSize: { xs: 30, md: 48 },
                  fontWeight: 'bold',
                  lineHeight: '1.1em',
                  mt: { xs: 3 },
                  mb: 3
                }}
              >
                Create your space
                <br /> to get started
              </Typography>
              <Card sx={{ px: 4, py: 2 }}>
                <CreateSpaceForm submitText='Get Started' />
              </Card>
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image px={3} maxWidth={{ xs: 300, md: 'none' }} src={splashImage} />
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

CreateSpace.getLayout = getBaseLayout;
