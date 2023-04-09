import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Image from 'components/common/Image';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import type { ErrorType } from 'lib/utilities/errors';
import splashImage from 'public/images/artwork/world.png';

import { Container } from './components/LoginLayout';
import { LoginButton } from './LoginButton';
import { LoginErrorModal } from './LoginErrorModal';

type Props = {
  hideLoginOptions?: boolean;
  isLoggingIn?: boolean;
};

export function LoginPageContent({ hideLoginOptions, isLoggingIn }: Props) {
  const { showMessage } = useSnackbar();
  const router = useRouter();

  // We either have disabled account error (handled by our modal) or discord error (handled with snackbar)
  const [discordLoginError, setDiscordLoginError] = useState<string | null>(null);

  function clearError() {
    setDiscordLoginError(null);
    setUrlWithoutRerender(router.pathname, { discordError: null });
  }

  useEffect(() => {
    if (router.query.discordError) {
      setDiscordLoginError(router.query.discordError as string);
    }
  }, [router.query]);

  useEffect(() => {
    if (discordLoginError && (discordLoginError as ErrorType) !== 'Disabled account') {
      showMessage(discordLoginError, 'error');
      clearError();
    }
  }, []);

  return (
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
            }
          }}
        >
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
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
            <Typography sx={{ fontSize: 20, mb: 6, maxWidth: '520px' }}>
              The solution for token communities to build relationships, work together and vote
            </Typography>
            <Box
              display={{ md: 'flex' }}
              gap={2}
              alignItems='center'
              justifyContent={{ xs: 'center', md: 'flex-start' }}
            >
              {isLoggingIn && <LoadingComponent label='Logging you in' />}
              {!hideLoginOptions && <LoginButton />}
            </Box>
          </Box>
        </Grid>
        <Grid item md={6} alignItems='center'>
          <Image display={{ xs: 'none', md: 'block' }} px={3} src={splashImage} />
        </Grid>
      </Grid>
      <LoginErrorModal open={(discordLoginError as ErrorType) === 'Disabled account'} onClose={clearError} />
    </Container>
  );
}
