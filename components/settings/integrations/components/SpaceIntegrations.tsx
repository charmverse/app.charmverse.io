import type { Space } from '@charmverse/core/prisma-client';
import { Stack } from '@mui/material';
import Typography from '@mui/material/Typography';

import { useIsAdmin } from 'hooks/useIsAdmin';

import { ConnectBoto } from './Boto/ConnectBoto';
import { ConnectCollabland } from './CollabLand/ConnectCollabland';
import { ConnectGithubApp } from './Github/ConnectGithubApp';
import { KycIntegration } from './KYC/KycIntegration';
import { SnapshotIntegration } from './Snapshot/SnapshotDomain';

export function SpaceIntegrations({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();

  return (
    <Stack gap={2} mt={2}>
      <SnapshotIntegration isAdmin={isAdmin} space={space} />
      <ConnectCollabland isAdmin={isAdmin} />
      <ConnectBoto isAdmin={isAdmin} />
      <ConnectGithubApp isAdmin={isAdmin} spaceId={space.id} spaceDomain={space.domain} />
      <KycIntegration isAdmin={isAdmin} space={space} />
    </Stack>
  );
}
