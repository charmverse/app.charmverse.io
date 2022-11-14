import type { ReactElement } from 'react';

import SettingsLayout from 'components/settings/Layout';
import MemberList from 'components/settings/members/MemberList';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { setTitle } from 'hooks/usePageTitle';

export default function MemberSettings () {

  const space = useCurrentSpace();
  const isAdmin = useIsAdmin();

  setTitle('Members');
  if (!space) {
    return null;
  }
  return (
    <MemberList isAdmin={isAdmin} spaceId={space.id} spaceOwner={space.createdBy} />
  );
}

MemberSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
