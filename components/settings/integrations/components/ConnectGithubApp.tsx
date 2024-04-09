import { log } from '@charmverse/core/log';
import { Grid, Stack, Typography } from '@mui/material';

import { useDisconnectGithubApplication, useGetGithubApplicationData } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { useGithubApp } from 'hooks/useGithubApp';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';

export function ConnectGithubApp({ spaceId, spaceDomain }: { spaceId: string; spaceDomain: string }) {
  const isAdmin = useIsAdmin();
  const { trigger: disconnectGithubApplication, isMutating: isDisconnectingGithubApplication } =
    useDisconnectGithubApplication(spaceId);
  const { data, isLoading: isLoadingGithubApplicationData, mutate } = useGetGithubApplicationData(spaceId);
  const { showMessage } = useSnackbar();

  async function handleDisconnect() {
    if (!data) {
      return;
    }

    try {
      await disconnectGithubApplication();
      showMessage('Github application disconnected', 'success');
      mutate(() => undefined, {
        revalidate: false
      });
    } catch (err) {
      showMessage('Failed to disconnect Github application', 'error');
      log.error('Failed to disconnect Github application', {
        installationId: data.spaceGithubCredential.installationId,
        spaceId
      });
    }
  }

  const { loading } = useGithubApp();
  return (
    <Grid container direction='row' gap={1} justifyContent='space-between' alignItems='center'>
      <Grid item>
        <Typography variant='body2'>Connect your space to Github to sync rewards and issues.</Typography>
      </Grid>
      {isAdmin &&
        (!data ? (
          <Grid item>
            <Button
              loading={loading || isLoadingGithubApplicationData}
              disabledTooltip={loading ? 'Connecting with CharmVerse Github App' : undefined}
              external
              href={`https://github.com/apps/dev-charmverse-integration/installations/new?state=${encodeURIComponent(
                JSON.stringify({
                  redirect: `${window?.location.origin}/${spaceDomain as string}`
                })
              )}`}
            >
              Connect
            </Button>
          </Grid>
        ) : (
          <Grid item xs={12}>
            <Stack flexDirection='row' justifyContent='space-between' alignItems='center' gap={1}>
              <Typography>
                Connected to <strong>{data.spaceGithubCredential.name}</strong>
              </Typography>
              <Button
                variant='outlined'
                color='error'
                loading={isDisconnectingGithubApplication}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </Stack>
          </Grid>
        ))}
    </Grid>
  );
}
