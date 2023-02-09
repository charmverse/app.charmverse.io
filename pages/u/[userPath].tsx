import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import NexusLayout from 'components/common/PageLayout/NexusLayout';
import PublicProfile from 'components/profile/PublicProfile';
import { usePageTitle } from 'hooks/usePageTitle';

export default function UserProfilePage() {
  const router = useRouter();

  const { data: user, error } = useSWR(`users/${router.query.userPath}`, () =>
    charmClient.getUserByPath(router.query.userPath as string)
  );

  const [, setPageTitle] = usePageTitle();

  useEffect(() => {
    const pageTitle = user?.username || '';

    setPageTitle(pageTitle);
  }, [user]);

  if (error?.status === 404) {
    return (
      <Box my={12}>
        <ErrorPage message={"Sorry, that user doesn't exist"} />
      </Box>
    );
  } else if (!user) {
    return <LoadingComponent minHeight={400} isLoading={true}></LoadingComponent>;
  } else {
    return <PublicProfile readOnly={true} user={user} />;
  }
}

UserProfilePage.getLayout = (page: ReactElement) => {
  return (
    <NexusLayout>
      <CenteredPageContent>{page}</CenteredPageContent>
    </NexusLayout>
  );
};
