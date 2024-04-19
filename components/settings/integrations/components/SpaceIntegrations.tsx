import type { Space } from '@charmverse/core/prisma-client';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import FieldLabel from 'components/common/form/FieldLabel';
import { useIsAdmin } from 'hooks/useIsAdmin';

import { ConnectBoto } from './ConnectBoto';
import { ConnectCollabland } from './ConnectCollabland';
import { ConnectGithubApp } from './ConnectGithubApp';
import { KycIntegration } from './KycIntegration';
import { SnapshotIntegration } from './SnapshotDomain';

export function SpaceIntegrations({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();

  return (
    <Grid container spacing={3} direction='column'>
      <Grid item>
        <FieldLabel>Snapshot.org domain</FieldLabel>
        <SnapshotIntegration isAdmin={isAdmin} space={space} />
      </Grid>
      <Grid item>
        <FieldLabel>Collab.Land</FieldLabel>
        <ConnectCollabland />
      </Grid>
      <Grid item>
        <FieldLabel>Send events to Discord/Telegram</FieldLabel>
        <ConnectBoto />
      </Grid>
      <Grid item>
        <FieldLabel>Sync with Github Repo</FieldLabel>
        <ConnectGithubApp spaceId={space.id} spaceDomain={space.domain} />
      </Grid>
      <Grid item>
        <FieldLabel>Kyc</FieldLabel>
        <Typography variant='body2' mb={2}>
          Choose your provider
        </Typography>
        <KycIntegration space={space} isAdmin={isAdmin} />
      </Grid>
    </Grid>
  );
}
