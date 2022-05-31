import { ReactElement } from 'react';
import NexusPageTitle from 'components/profile/components/NexusPageTitle';
import PageLayout from 'components/profile/components/ProfileLayout';
import { setTitle } from 'hooks/usePageTitle';
import PublicProfile from 'components/profile/public';
import { useUser } from 'hooks/useUser';

export default function PublicProfilePage () {

  setTitle('Public Profile');

  const [user, setUser] = useUser();

  if (!user) {
    return null;
  }

  return (
    <>
      <NexusPageTitle title='My Public Profile' />
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
