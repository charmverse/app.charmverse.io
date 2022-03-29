import { useContext, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Image from 'components/common/Image';
import styled from '@emotion/styled';
import PrimaryButton from 'components/common/PrimaryButton';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import useSWRImmutable from 'swr/immutable';
import splashImage from 'public/images/artwork/world.png';
import { useRouter } from 'next/router';
import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useSpaces } from 'hooks/useSpaces';

export const Container = styled(Box)`
  max-width: 100%;
  width: 1170px;
  margin: 0 auto;
`;

// Handle cases
// 1. New user, dont have a charmverse account, clicks on Connect Discord
// 2. User who have connected with their wallet before but haven't created any workspace and discord connected
// 3. Old user who have some charmverse workspace and discord connected
// 4. Old user who have some charmverse workspace and but not discord connected

export default function LoginPageContent ({ account }: { account: string | null | undefined }) {
  const router = useRouter();

  const isCreatingAccountWithDiscord = typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'login';
  const { showMessage } = useSnackbar();
  const [user, setUser, , setIsLoaded] = useUser();
  const [spaces] = useSpaces();

  useSWRImmutable(isCreatingAccountWithDiscord ? [router.query.code, router.query.discord, router.query.type] : null, async () => {
    charmClient.loginWithDiscord({
      code: router.query.code as string
    }).then((loggedInUser) => {
      setUser(loggedInUser);
      setIsLoaded(true);
    }).catch(err => {
      showMessage(err.message ?? err.error ?? 'Something went wrong', 'error');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    });
  });

  useEffect(() => {
    if (spaces.length !== 0 && user) {
      router.push(`/${spaces[0].domain}`);
    }
  }, [spaces && user]);

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
            <Box display='flex' gap={1}>
              <PrimaryButton size='large' loading={!triedEager} onClick={openWalletSelectorModal}>
                Connect Wallet
              </PrimaryButton>
              <PrimaryButton size='large' loading={!triedEager} href={`/api/discord/oauth?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=login`}>
                Connect Discord
              </PrimaryButton>
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
