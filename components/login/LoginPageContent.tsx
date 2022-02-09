import { useContext } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import styled from '@emotion/styled';
import PrimaryButton from 'components/common/PrimaryButton';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { blackColor } from 'theme/colors';

import splashImage from 'public/images/charmverse_world.png';

export const Container = styled(Box)`
  max-width: 100%;
  width: 1170px;
  margin: 0 auto;
`;

const ImageWrapper = styled(Box)`
  ${({ theme }) => theme.palette.mode === 'dark' && 'filter: invert(100%);'}
`;

export default function LoginPageContent ({ account }: { account: string | null | undefined }) {

  const { openWalletSelectorModal, triedEager } = useContext(Web3Connection);

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
          <ImageWrapper sx={{ maxWidth: 300 }}>
            <Image src={splashImage} />
          </ImageWrapper>
        </Grid>
        <Grid item xs={12} sm={6} display='flex' justifyContent='center'>
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
              Tasks, docs, and more
            </Typography>
            {account ? (
              <PrimaryButton size='large' href='/'>
                Go to Workspace
              </PrimaryButton>
            ) : (
              <PrimaryButton size='large' loading={!triedEager} onClick={openWalletSelectorModal}>
                Connect Wallet
              </PrimaryButton>
            )}
          </Box>
        </Grid>
        <Grid item display={{ xs: 'none', sm: 'flex' }} sm={6} alignItems='center'>
          <ImageWrapper px={3}>
            <Image src={splashImage} />
          </ImageWrapper>
        </Grid>
      </Grid>
    </Container>
  );
}
