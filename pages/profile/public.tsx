import { ReactElement } from 'react';
import PageLayout from 'components/profile/components/ProfileLayout';
import { setTitle } from 'hooks/usePageTitle';
import PublicProfile from 'components/profile/public';

export default function PublicProfilePage () {

  setTitle('');

  return (
    <PublicProfile />
  );

}

PublicProfilePage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
