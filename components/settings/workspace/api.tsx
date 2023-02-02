import type { ReactElement } from 'react';

import { ApiSettings } from 'components/settings/api/Api';
import SettingsLayout from 'components/settings/Layout';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { setTitle } from 'hooks/usePageTitle';

export default function ApiSettingsPage() {
  const space = useCurrentSpace();
  const isAdmin = useIsAdmin();

  setTitle('Api');
  if (!space) {
    return null;
  }
  return <ApiSettings isAdmin={isAdmin} spaceId={space.id} spaceOwner={space.createdBy} />;
}

ApiSettingsPage.getLayout = (page: ReactElement) => {
  return <SettingsLayout>{page}</SettingsLayout>;
};
