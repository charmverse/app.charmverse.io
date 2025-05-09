import type { Space } from '@charmverse/core/prisma-client';
import { Stack } from '@mui/material';

import { useIsAdmin } from 'hooks/useIsAdmin';

import { BotoSettings } from './Boto/BotoSettings';
import { CollabLandSettings } from './CollabLand/CollabLandSettings';
import { DocumentSettings } from './DocumentSigning/DocumentSettings';
import { GithubSettings } from './Github/GithubSettings';
import { KYCSettings } from './KYC/KYCSettings';
import { SnapshotSettings } from './Snapshot/SnapshotSettings';

export function SpaceIntegrations({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();

  return (
    <Stack gap={2} mt={2}>
      <SnapshotSettings isAdmin={isAdmin} space={space} />
      <CollabLandSettings isAdmin={isAdmin} />
      <BotoSettings isAdmin={isAdmin} />
      <GithubSettings isAdmin={isAdmin} spaceId={space.id} spaceDomain={space.domain} />
      <KYCSettings isAdmin={isAdmin} space={space} />
      <DocumentSettings isAdmin={isAdmin} />
    </Stack>
  );
}
