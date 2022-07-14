import { ReactElement } from 'react';
import NexusPageTitle from 'components/nexus/components/NexusPageTitle';
import PageLayout from 'components/nexus/components/NexusLayout';
import { setTitle } from 'hooks/usePageTitle';
import PublicProfile from 'components/profile';
import { useUser } from 'hooks/useUser';

export default function PublicProfilePage () {

  setTitle('My Profile');

  const [user, setUser] = useUser();

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
