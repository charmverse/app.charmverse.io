import { Grid, Typography } from '@mui/material';

import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useGithubApp } from 'hooks/useGithubApp';
import { useIsAdmin } from 'hooks/useIsAdmin';

export function ConnectGithubApp() {
  const isAdmin = useIsAdmin();
  const { loading } = useGithubApp();
  const { space } = useCurrentSpace();
  return (
    <Grid container direction='row' gap={2} justifyContent='space-between' alignItems='center'>
      <Grid item>
        <Typography variant='body2'>Connect your space to Github to sync rewards and issues.</Typography>
      </Grid>
      {isAdmin && space && (
        <Grid item>
          <Button
            loading={loading}
            disabledTooltip={loading ? 'Connecting with CharmVerse Github App' : undefined}
            external
            href={`https://github.com/apps/dev-charmverse-integration/installations/new?state=${encodeURIComponent(
              JSON.stringify({
                redirect: `${window?.location.origin}/${space.domain as string}`
              })
            )}`}
          >
            Connect
          </Button>
        </Grid>
      )}
    </Grid>
  );
}
