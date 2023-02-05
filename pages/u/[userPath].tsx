import { Box } from '@mui/material';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import fetch from 'adapters/http/fetch.server';
import ErrorPage from 'components/common/errors/ErrorPage';
import PageLayout from 'components/nexus/components/NexusLayout';
import PublicProfile from 'components/profile/PublicProfile';
import { usePageTitle } from 'hooks/usePageTitle';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

export const getServerSideProps: GetServerSideProps<{ user: PublicUser | null }, { userPath: string }> = async (
  context
) => {
  const params = context.params;
  const origin = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://app.charmverse.io';
  try {
    if (params?.userPath) {
      const user = await fetch<PublicUser>(`${origin}/api/public/profile/${params.userPath}`);
      return {
        props: {
          user
        }
      };
    }
    return {
      props: {
        user: null
      }
    };
  } catch (err) {
    return {
      props: {
        user: null
      }
    };
  }
};

export default function UserProfilePage({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [, setPageTitle] = usePageTitle();

  useEffect(() => {
    let pageTitle = '';
    if (user) {
      pageTitle = user.username || '';
    }
    setPageTitle(pageTitle);
  }, [user]);

  if (!user) {
    return (
      <Box my={12}>
        <ErrorPage message={"Sorry, that user doesn't exist"} />
      </Box>
    );
  } else {
    return (
      <>
        <Head>
          <title>{user.username} | Profile</title>
          <meta
            name='description'
            content={user.profile?.description ?? `Check out ${user.username}'s public CharmVerse profile`}
          />
          <meta
            property='og:description'
            content={user.profile?.description ?? `Check out ${user.username}'s public CharmVerse profile`}
          />
          <meta property='og:title' content={`${user.username} | Profile`} />
          {user.avatar && <meta property='og:image' content={user.avatar} />}
          {user.avatar && <meta property='twitter:image' content={user.avatar} />}
        </Head>
        <PublicProfile readOnly={true} user={user} />
      </>
    );
  }
}

UserProfilePage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};
