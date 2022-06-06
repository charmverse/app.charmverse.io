import { useContext } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Image from 'components/common/Image';
import styled from '@emotion/styled';
import Button from 'components/common/Button';
import PrimaryButton from 'components/common/PrimaryButton';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import splashImage from 'public/images/artwork/world.png';

export const Container = styled(Box)`
  max-width: 100%;
  width: 1170px;
  margin: 0 auto;
`;

export default function LoginPageContent () {
  const { openWalletSelectorModal, triedEager } = useContext(Web3Connection);
  const returnUrl = new URLSearchParams(decodeURIComponent(window.location.search)).get('returnUrl');

  return (
    <Container px={3}>
      <Grid container>
        <Grid
          item
          xs={12}
          display={{ xs: 'flex', sm: 'none' }}
          justifyContent='center'
          py={3}
          px={6}
        >
          <Image sx={{ maxWidth: 300 }} src={splashImage} />
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          sx={{
            display: 'flex',
            justifyContent: {
              xs: 'center',
              sm: 'flex-start'
            }
          }}
        >
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography
              sx={{
                fontSize: { xs: 30, md: 48 },
                fontWeight: 'bold',
                lineHeight: '1.1em',
                mt: { xs: 3, md: '100px' },
                mb: 3
              }}
            >
              First Web 3 Native
              {' '}
              <br />
              All-in-one Workspace
            </Typography>
            <Typography sx={{ fontSize: 20, mb: 6 }}>
              Tasks, docs, bounties, and more
            </Typography>
            <Box display='flex' gap={2} alignItems='center'>
              <PrimaryButton size='large' loading={!triedEager} onClick={openWalletSelectorModal}>
                Connect Wallet
              </PrimaryButton>
              <Typography color='secondary' variant='body2'>or</Typography>
              <Button variant='outlined' size='large' href={`/api/discord/oauth?type=login&redirect=${returnUrl ?? '/'}`}>
                Connect Discord
              </Button>
            </Box>
          </Box>
        </Grid>
        <Grid item display={{ xs: 'none', sm: 'flex' }} sm={6} alignItems='center'>
          <Image px={3} src={splashImage} />
        </Grid>
      </Grid>
    </Container>
  );
}
