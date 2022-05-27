import { ReactElement } from 'react';
import PageLayout from 'components/profile/components/ProfileLayout';
import PublicProfile from 'components/profile/public/PublicProfile';
import LoadingComponent from 'components/common/LoadingComponent';
import ErrorPage from 'components/common/errors/ErrorPage';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import charmClient from 'charmClient';
import { Box } from '@mui/material';

export default function UserProfilePage () {
  const router = useRouter();

  const { data: user, error } = useSWR(`users/${router.query.userPath}`, () => charmClient.getUserByPath(router.query.userPath as string));

  if (error?.status === 404) {
    return <Box my={12}><ErrorPage message={'Sorry, that user doesn\'t exist'} /></Box>;
  }
  else if (!user) {
    return <LoadingComponent minHeight={400} isLoading={true}></LoadingComponent>;
  }
  else {
    return <PublicProfile readOnly={true} user={user} />;
  }
}

UserProfilePage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
