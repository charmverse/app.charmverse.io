import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import { setTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import RoleAssignment from 'components/settings/roles/RoleAssignment';
import InviteLinkList from 'components/settings/contributors/InviteLinks/InviteLinks';
import ContributorList from 'components/settings/contributors/ContributorList';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';

export default function ContributorSettings () {

  const [space] = useCurrentSpace();
  const [user] = useUser();

  const isAdmin = isSpaceAdmin(user, space?.id);

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
