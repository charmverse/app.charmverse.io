import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import { setTitle } from 'hooks/usePageTitle';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import InviteLinkList from 'components/settings/contributors/InviteLinks/InviteLinks';
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
    <>
      <InviteLinkList isAdmin={isAdmin} spaceId={space.id} />
      <ContributorList isAdmin={isAdmin} spaceId={space.id} spaceOwner={space.createdBy} />
    </>
  );
}

ContributorSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
