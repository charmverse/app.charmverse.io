import type { Space } from '@charmverse/core/prisma-client';

import { useTrackPageView } from 'charmClient/hooks/track';
import { SpaceIntegrations } from 'components/settings/integrations/components/SpaceIntegrations';
import Legend from 'components/settings/Legend';

export function IntegrationSettings({ space }: { space: Space }) {
  useTrackPageView({ type: 'settings/integrations' });

  return (
    <>
      <Legend>Integrations</Legend>
      <SpaceIntegrations space={space} />
    </>
  );
}
