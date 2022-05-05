import { ReactElement } from 'react';
import PageLayout from 'components/profile/components/ProfileLayout';
import { setTitle } from 'hooks/usePageTitle';
import Integrations from 'components/profile/integrations';

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
