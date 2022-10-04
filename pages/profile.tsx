import type { ReactElement } from 'react';

import PageLayout from 'components/nexus/components/NexusLayout';
import NexusPageTitle from 'components/nexus/components/NexusPageTitle';
import PublicProfile from 'components/profile';
import { setTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';

export default function PublicProfilePage () {

  setTitle('My Profile');

  const { user, setUser } = useUser();

  if (!user) {
    return null;
  }

  return (
    <>
      <NexusPageTitle subPage='My Profile' />
      <PublicProfile user={user} updateUser={setUser} />
    </>
  );

}

PublicProfilePage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
