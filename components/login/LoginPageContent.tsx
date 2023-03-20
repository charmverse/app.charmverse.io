import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Button from 'components/common/Button';
import Image from 'components/common/Image';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import type { ErrorType } from 'lib/utilities/errors';
import splashImage from 'public/images/artwork/world.png';

import { Login } from './Login';
import { LoginErrorModal } from './LoginErrorModal';

export const Container = styled(Box)`
  max-width: 100%;
  width: 1170px;
  margin: 0 auto;
`;

type Props = {
  hideLoginOptions?: boolean;
  isLoggingIn?: boolean;
};

export function LoginPageContent({ hideLoginOptions, isLoggingIn }: Props) {
  const returnUrl = new URLSearchParams(decodeURIComponent(window.location.search)).get('returnUrl');
  const { showMessage } = useSnackbar();
  const router = useRouter();

  // We either have disabled account error (handled by our modal) or discord error (handled with snackbar)
  const [discordLoginError, setDiscordLoginError] = useState(
    new URLSearchParams(decodeURIComponent(window.location.search)).get('discordError')
  );

  function clearError() {
    setDiscordLoginError(null);
    setUrlWithoutRerender(router.pathname, { discordError: null });
  }

  useEffect(() => {
    if (discordLoginError && (discordLoginError as ErrorType) !== 'Disabled account') {
      showMessage(discordLoginError, 'error');
      clearError();
    }
  }, []);

  return (
    <Container px={3} data-test='login-page-content'>
      <Grid container>
        <Grid item xs={12} display={{ xs: 'flex', sm: 'none' }} justifyContent='center' py={3} px={6}>
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
              Powering the Future <br />
              of Work through Web3
            </Typography>
            <Typography sx={{ fontSize: 20, mb: 6 }}>
              The solution for token communities to build relationships,
              <br />
              work together and vote
            </Typography>
            <Box display={{ sm: 'flex' }} gap={2} alignItems='center'>
              {isLoggingIn && <LoadingComponent label='Logging you in' />}
              {!hideLoginOptions && (
                <>
                  <Login />
                  <Typography color='secondary' variant='body2' sx={{ lineHeight: '40px' }}>
                    or
                  </Typography>
                  <Button
                    data-test='connect-discord'
                    sx={{ width: '100%' }}
                    variant='outlined'
                    size='large'
                    href={`/api/discord/oauth?type=login&redirect=${returnUrl ?? '/'}`}
                  >
                    Connect Discord
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Grid>
        <Grid item display={{ xs: 'none', sm: 'flex' }} sm={6} alignItems='center'>
          <Image px={3} src={splashImage} />
        </Grid>
      </Grid>
      <LoginErrorModal open={(discordLoginError as ErrorType) === 'Disabled account'} onClose={clearError} />
    </Container>
  );
}
