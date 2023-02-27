import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import type { Space } from '@prisma/client';
import { useEffect } from 'react';

import Button from 'components/common/Button';
import PrimaryButton from 'components/common/PrimaryButton';

import { VerifyCheckmark } from '../VerifyCheckmark';

import { useSummonGate } from './hooks/useSummonGate';

type Props = {
  spaceDomain: string;
  onLoad: () => void;
  onSuccess: (space: Space) => void;
};

export function SummonGate({ onLoad, onSuccess, spaceDomain }: Props) {
  const { discordGate, isConnectedToDiscord, isLoading, verify, joiningSpace } = useSummonGate({
    spaceDomain,
    onSuccess
  });

  useEffect(() => {
    if (!isLoading) {
      onLoad();
    }
  }, [isLoading]);

  if (!discordGate?.hasDiscordServer) {
    return null;
  }
  const { isEligible } = discordGate;

  const returnUrl = encodeURIComponent(window.location.href);

  return (
    <Stack>
      <Card
        variant='outlined'
        raised={isEligible === true}
        color={isEligible === true ? 'success' : 'default'}
        sx={{ my: 1, mt: 3, borderColor: isEligible ? 'success.main' : '' }}
      >
        <CardContent>
          <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Grid item xs={12} sm={8}>
              {isConnectedToDiscord && isEligible && (
                <Typography>You are a part of this space discord community and you can join it.</Typography>
              )}
              {isConnectedToDiscord && !isEligible && (
                <Typography>You are not a part of this space discord community.</Typography>
              )}
              {!isConnectedToDiscord && (
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
                    <VerifyCheckmark isLoading={isLoading} isVerified={isEligible} />
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

      {isEligible && (
        <PrimaryButton disabled={joiningSpace} onClick={verify} loading={joiningSpace}>
          Join Space
        </PrimaryButton>
      )}
    </Stack>
  );
}
