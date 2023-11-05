import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import Image from 'components/common/Image';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import type { ErrorType } from 'lib/utilities/errors';

import { LoginButton } from './components/LoginButton';
import { LoginErrorModal } from './components/LoginErrorModal';
import { Container } from './components/LoginLayout';

const splashImage = '/images/artwork/world.png';

type Props = {
  hideLoginOptions?: boolean;
  isLoggingIn?: boolean;
  children?: ReactNode;
};

export function LoginPageContent({ hideLoginOptions, isLoggingIn, children }: Props) {
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
  }, [router.query.discordError]);

  useEffect(() => {
    if (discordLoginError && !isDisabledAccountError(discordLoginError)) {
      showMessage(discordLoginError, 'error');
      clearError();
    }
  }, [discordLoginError]);

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
                display: { xs: 'none', md: 'block' },
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

            <Box display={{ xs: 'flex', md: 'none' }} mb={2} mx={2} justifyContent='center'>
              <Image src={splashImage} maxWidth={400} />
            </Box>
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                fontSize: 20,
                mb: { sm: 2, md: 6 },
                maxWidth: { md: '520px' }
              }}
            >
              The solution for token communities to build relationships, work together and vote
            </Typography>
            <Box
              display={{ md: 'flex' }}
              gap={2}
              alignItems='center'
              justifyContent={{ xs: 'center', md: 'flex-start' }}
            >
              {isLoggingIn && <LoadingComponent label='Logging you in' />}
              {!hideLoginOptions && <LoginButton showSignup />}
            </Box>
            {children}
          </Box>
        </Grid>
        <Grid item md={6} display={{ xs: 'none', md: 'block' }} alignItems='center'>
          <Image px={3} src={splashImage} />
        </Grid>
      </Grid>
      <LoginErrorModal open={isDisabledAccountError(discordLoginError)} onClose={clearError} />
    </Container>
  );
}

function isDisabledAccountError(error: string | null) {
  return (error as ErrorType) === 'Disabled account';
}
