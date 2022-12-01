import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import type { Space } from '@prisma/client';

import Button from 'components/common/Button';
import { useDiscordGate } from 'components/common/DiscordGate/hooks/useDiscordGate';
import PrimaryButton from 'components/common/PrimaryButton';
import { VerifyCheckmark } from 'components/common/TokenGateForm/VerifyCheckmark';
import { DiscordProvider } from 'components/integrations/components/DiscordProvider';

type Props = {
  spaceDomain: string;
  onSuccess: (space: Space) => void;
};

export function DiscordGate({ spaceDomain, onSuccess }: Props) {
  const {
    discordGate,
    isConnectedToDiscord,
    isLoading: isLoadingGate,
    joinSpace,
    joiningSpace
  } = useDiscordGate({ spaceDomain, onSuccess });

  if (!discordGate?.hasDiscordServer) {
    return null;
  }
  const { isEligible } = discordGate;

  return (
    <Stack>
      <Card
        variant='outlined'
        raised={isEligible === true}
        color={isEligible === true ? 'success' : 'default'}
        sx={{ my: 1, mt: 3, borderColor: isEligible ? 'success.main' : '' }}
      >
        <CardContent>
          <DiscordProvider>
            {({ isLoading, connect, error }) => (
              <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Grid item xs={12} sm={8}>
                  {isConnectedToDiscord ? (
                    <Typography>
                      {isEligible
                        ? 'You are a part of this workspace discord community and you can join it.'
                        : 'You are not a part of this space discord community.'}
                    </Typography>
                  ) : (
                    <Stack>
                      <Typography variant='body2'>
                        Connect your Discord account to verify if you are eligible to join this space.
                      </Typography>
                    </Stack>
                  )}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack justifyContent='center' alignItems='center' height='100%'>
                    {isConnectedToDiscord ? (
                      <Stack justifyContent='end' direction='row' alignSelf='stretch' pr={3}>
                        <VerifyCheckmark isLoading={isLoadingGate} isVerified={isEligible} />
                      </Stack>
                    ) : (
                      <Button
                        color='discord'
                        disabled={isLoading}
                        onClick={connect}
                        loading={isLoading}
                        sx={{ width: 140 }}
                      >
                        Connect
                      </Button>
                    )}
                  </Stack>
                </Grid>

                {error && (
                  <Grid item xs={12}>
                    <Alert severity='error'>{error}</Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </DiscordProvider>
        </CardContent>
      </Card>

      {isEligible && (
        <PrimaryButton disabled={joiningSpace} onClick={joinSpace} loading={joiningSpace}>
          Join Space
        </PrimaryButton>
      )}
    </Stack>
  );
}
