import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';

import Button from 'components/common/Button';
import PrimaryButton from 'components/common/PrimaryButton';
import type { CheckDiscordGateResult } from 'lib/discord/interface';

import { VerifyCheckmark } from '../VerifyCheckmark';

type Props = {
  isLoadingGate: boolean;
  isConnectedToDiscord: boolean;
  discordGate?: CheckDiscordGateResult;
  joinSpace: () => Promise<void>;
  joiningSpace: boolean;
};

export function DiscordGate({ isConnectedToDiscord, discordGate, joinSpace, joiningSpace, isLoadingGate }: Props) {
  if (!discordGate?.hasDiscordServer) {
    return null;
  }
  const { isVerified } = discordGate;

  const returnUrl = encodeURIComponent(window.location.href);

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
            <Grid item xs={12} sm={8}>
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
            <Grid item xs={12} sm={4}>
              <Stack justifyContent='center' alignItems='center' height='100%'>
                {isConnectedToDiscord ? (
                  <Stack justifyContent='end' direction='row' alignSelf='stretch' pr={3}>
                    <VerifyCheckmark isLoading={isLoadingGate} isVerified={isVerified} />
                  </Stack>
                ) : (
                  <Button
                    color='discord'
                    data-test='connect-discord'
                    sx={{ width: 140 }}
                    size='large'
                    href={`/api/discord/oauth?type=login&redirect=${returnUrl ?? '/'}`}
                  >
                    Connect Discord
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isVerified && (
        <PrimaryButton disabled={joiningSpace} onClick={joinSpace} loading={joiningSpace}>
          Join Space
        </PrimaryButton>
      )}
    </Stack>
  );
}
