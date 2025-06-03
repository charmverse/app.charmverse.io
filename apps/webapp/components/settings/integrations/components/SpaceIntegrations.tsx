import type { Space } from '@charmverse/core/prisma-client';
import { Stack } from '@mui/material';

import { useIsAdmin } from 'hooks/useIsAdmin';

import { DocumentSettings } from './DocumentSigning/DocumentSettings';
import { KYCSettings } from './KYC/KYCSettings';
import { SnapshotSettings } from './Snapshot/SnapshotSettings';

export function SpaceIntegrations({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();

  return (
    <Stack gap={2} mt={2}>
      <SnapshotSettings isAdmin={isAdmin} space={space} />
      <KYCSettings isAdmin={isAdmin} space={space} />
      <DocumentSettings isAdmin={isAdmin} />
    </Stack>
  );
}
