import type { ReactElement } from 'react';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import Integrations from 'components/integrations';
import PageLayout from 'components/nexus/components/NexusLayout';
import { setTitle } from 'hooks/usePageTitle';

export default function IntegrationsPage () {

  setTitle('Integrations');

  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'integrations' });
  }, []);

  return (
    <Integrations />
  );

}

IntegrationsPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
