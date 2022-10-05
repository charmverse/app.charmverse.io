import type { ReactElement } from 'react';

import ContributorList from 'components/settings/contributors/ContributorList';
import SettingsLayout from 'components/settings/Layout';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { setTitle } from 'hooks/usePageTitle';

export default function ContributorSettings () {

  const [space] = useCurrentSpace();
  const isAdmin = useIsAdmin();

  setTitle('Contributors');
  if (!space) {
    return null;
  }
  return (
    <ContributorList isAdmin={isAdmin} spaceId={space.id} spaceOwner={space.createdBy} />
  );
}

ContributorSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
