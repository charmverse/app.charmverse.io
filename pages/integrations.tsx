import type { ReactElement } from 'react';

import Integrations from 'components/integrations';
import PageLayout from 'components/nexus/components/NexusLayout';
import { setTitle } from 'hooks/usePageTitle';

export default function IntegrationsPage () {

  setTitle('Integrations');

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
