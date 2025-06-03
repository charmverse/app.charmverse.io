import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import { useDiscordConnection } from 'hooks/useDiscordConnection';

import { VerifyCheckmark } from '../VerifyCheckmark';

import type { DiscordGateState } from './hooks/useDiscordGate';

export function DiscordGate({
  isConnectedToDiscord,
  discordGate,
  joinSpace,
  joiningSpace,
  isVerifying
}: DiscordGateState) {
  const { popupLogin } = useDiscordConnection();
  const isVerified = discordGate?.isVerified;
  const returnUrl = encodeURIComponent(window.location.href);
  const onClick = () => popupLogin(returnUrl ?? '/', 'login');

  return (
    <Stack>
      <Card
        variant='outlined'
        raised={isVerified === true}
        color={isVerified === true ? 'success' : 'default'}
        sx={{ my: 1, mt: 3, borderColor: isVerified ? 'success.main' : '' }}
      >
        <CardContent>
          <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              {isConnectedToDiscord && isVerified && (
                <Typography>You are a part of this Discord community and you can join it</Typography>
              )}
              {isConnectedToDiscord && !isVerified && (
                <Typography>You are not a part of this Discord community</Typography>
              )}
              {!isConnectedToDiscord && (
                <Stack>
                  <Typography variant='body2'>
                    Connect your Discord account to verify if you are eligible to join this space
                  </Typography>
                </Stack>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Stack justifyContent='center' alignItems='center' height='100%'>
                {isConnectedToDiscord ? (
                  <Stack justifyContent='end' direction='row' alignSelf='stretch' pr={3}>
                    <VerifyCheckmark isLoading={isVerifying} isVerified={isVerified} />
                  </Stack>
                ) : (
                  <Button
                    color='discord'
                    data-test='connect-discord'
                    sx={{ width: 140 }}
                    size='large'
                    onClick={onClick}
                  >
                    Connect Discord
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
