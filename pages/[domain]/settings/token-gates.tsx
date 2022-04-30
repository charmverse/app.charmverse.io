import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import { setTitle } from 'hooks/usePageTitle';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import TokenGateList from 'components/settings/token-gates/TokenGates';
import useIsAdmin from 'hooks/useIsAdmin';

export default function ContributorSettings () {

  const [space] = useCurrentSpace();
  const isAdmin = useIsAdmin();

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
