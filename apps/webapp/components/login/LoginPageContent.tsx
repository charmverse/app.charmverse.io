import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';
import type { ErrorType } from '@packages/utils/errors';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import Image from 'components/common/Image';
import LoadingComponent from 'components/common/LoadingComponent';
import WorkspaceAvatar from 'components/common/PageLayout/components/Sidebar/components/WorkspaceAvatar';
import { useBaseCurrentDomain } from 'hooks/useBaseCurrentDomain';
import { useSnackbar } from 'hooks/useSnackbar';
import splashImage from 'public/images/artwork/world.png';

import { LoginButton } from './components/LoginButton';
import { LoginErrorModal } from './components/LoginErrorModal';
import { Container } from './components/LoginLayout';

type Props = {
  hideLoginOptions?: boolean;
  isLoggingIn?: boolean;
  children?: ReactNode;
};

export function LoginPageContent({ hideLoginOptions, isLoggingIn, children }: Props) {
  const { showMessage } = useSnackbar();
  const router = useRouter();
  const { customDomain, spaceFromPath, isSpaceLoading } = useBaseCurrentDomain();

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

  if (customDomain === undefined) {
    return <Container px={3} data-test='login-page-content' />;
  }

  if (customDomain && isSpaceLoading) {
    return (
      <Container px={3} data-test='login-page-content'>
        <LoadingComponent isLoading={true} size={60} />
      </Container>
    );
  }

  const image = spaceFromPath ? (
    <WorkspaceAvatar
      image={spaceFromPath?.spaceArtwork || spaceFromPath?.spaceImage || ''}
      name={spaceFromPath?.name || ''}
      size='3xLarge'
    />
  ) : customDomain === null ? (
    <Image src={splashImage} px={3} />
  ) : null;

  const subtitle = customDomain === null && (
    <Typography
      sx={{
        display: { xs: 'none', md: 'block' },
        fontSize: 20,
        mb: { sm: 2, md: 6 },
        maxWidth: { md: '520px' }
      }}
    >
      Manage grants. Connect with builders. Forge new ideas.
    </Typography>
  );

  const title = spaceFromPath ? (
    `Login to ${spaceFromPath?.name}`
  ) : customDomain === null ? (
    <>
      The Network for <br />
      Onchain Communities
    </>
  ) : null;

  return (
    <Container px={3} data-test='login-page-content'>
      <Grid container>
        <Grid
          size={{ xs: 12, md: 6 }}
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
              {title}
            </Typography>
            <Box display={{ xs: 'flex', md: 'none' }} mb={2} mx={2} justifyContent='center'>
              {image}
            </Box>
            {subtitle}
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
        <Grid size={{ md: 6 }} display={{ xs: 'none', md: 'block' }} alignItems='center'>
          {image}
        </Grid>
      </Grid>
      <LoginErrorModal open={isDisabledAccountError(discordLoginError)} onClose={clearError} />
    </Container>
  );
}

function isDisabledAccountError(error: string | null) {
  return (error as ErrorType) === 'Disabled account';
}
