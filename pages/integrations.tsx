import { ReactElement } from 'react';
import PageLayout from 'components/nexus/components/ProfileLayout';
import { setTitle } from 'hooks/usePageTitle';
import Integrations from 'components/profile/integrations';

export default function IntegrationsPage () {

  setTitle('My Integrations');

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
