import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import { setTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import TokenGateList from 'components/settings/TokenGates';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';

export default function ContributorSettings () {

  const [space] = useCurrentSpace();
  const [user] = useUser();

  const isAdmin = isSpaceAdmin(user, space?.id);

  setTitle('Token Gates');
  if (!space) {
    return null;
  }
  return (
    <TokenGateList isAdmin={isAdmin} spaceId={space.id} />
  );
}

ContributorSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
