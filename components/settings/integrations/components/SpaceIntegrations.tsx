import type { Space } from '@charmverse/core/prisma-client';
import { Stack } from '@mui/material';
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
    <Stack gap={2} mt={2}>
      <SnapshotIntegration isAdmin={isAdmin} space={space} />
      <ConnectCollabland />
      <FieldLabel>Send events to Discord/Telegram</FieldLabel>
      <ConnectBoto />
      <FieldLabel>Sync with Github Repo</FieldLabel>
      <ConnectGithubApp spaceId={space.id} spaceDomain={space.domain} />
      <FieldLabel>Kyc</FieldLabel>
      <Typography variant='body2' mb={2}>
        Choose your provider
      </Typography>
      <KycIntegration space={space} isAdmin={isAdmin} />
    </Stack>
  );
}
