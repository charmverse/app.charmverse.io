import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import PageLayout from 'components/nexus/components/NexusLayout';
import PublicProfile from 'components/profile/PublicProfile';
import { usePageTitle } from 'hooks/usePageTitle';

export default function UserProfilePage () {
  const router = useRouter();

  const { data: user, error } = useSWR(`users/${router.query.userPath}`, () => charmClient.getUserByPath(router.query.userPath as string));

  const [, setPageTitle] = usePageTitle();

  useEffect(() => {
    let pageTitle = '';
    if (user) {
      pageTitle = user.username || '';
    }
    setPageTitle(pageTitle);
  }, [user]);

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
