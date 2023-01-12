import type { ReactElement } from 'react';

import Api from 'components/settings/api/Api';
import SettingsLayout from 'components/settings/Layout';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { setTitle } from 'hooks/usePageTitle';

export default function ApiSettings() {
  const space = useCurrentSpace();
  const isAdmin = useIsAdmin();

  setTitle('Api');
  if (!space) {
    return null;
  }
  return <Api isAdmin={isAdmin} spaceId={space.id} spaceOwner={space.createdBy} />;
}

ApiSettings.getLayout = (page: ReactElement) => {
  return <SettingsLayout>{page}</SettingsLayout>;
};
