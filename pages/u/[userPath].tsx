import { ReactElement } from 'react';
import PageLayout from 'components/profile/components/ProfileLayout';
import PublicProfile from 'components/profile/public/PublicProfile';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import charmClient from 'charmClient';

export default function UserProfilePage () {
  const router = useRouter();
  const { data: user } = useSWR(`users/${router.query.userPath}`, () => charmClient.getUser());
  if (!user) {
    return null;
  }
  return (
    <PublicProfile readOnly={true} user={user} />
  );
}

UserProfilePage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
