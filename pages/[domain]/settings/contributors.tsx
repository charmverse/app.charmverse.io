import SettingsLayout from 'components/settings/Layout';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { setTitle } from 'hooks/usePageTitle';
import { ReactElement } from 'react';
import ContributorList from 'components/settings/contributors/ContributorList';
import useIsAdmin from 'hooks/useIsAdmin';

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
