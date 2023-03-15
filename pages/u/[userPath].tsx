import { Box } from '@mui/material';
import log from 'loglevel';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import NexusLayout from 'components/common/PageLayout/NexusLayout';
import { PublicProfile } from 'components/profile/PublicProfile';
import { prisma } from 'db';
import { usePageTitle } from 'hooks/usePageTitle';
import { isUUID } from 'lib/utilities/strings';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

export const getServerSideProps: GetServerSideProps<{ publicUser: PublicUser | null }, { userPath: string }> = async (
  context
) => {
  const params = context.params;
  const userPath = params?.userPath;
  try {
    if (userPath) {
      const condition = isUUID(userPath)
        ? {
            OR: [{ id: userPath }, { path: userPath }]
          }
        : { path: userPath };

      const user = await prisma.user.findFirst({
        where: condition,
        select: {
          id: true,
          username: true,
          avatar: true,
          avatarTokenId: true, // used to determine if user has an NFT avatar
          path: true,
          profile: true
        }
      });

      if (!user) {
        return {
          props: {
            publicUser: null
          }
        };
      }

      return {
        props: {
          publicUser: {
            ...user,
            visibleNfts: [],
            visiblePoaps: []
          }
        }
      };
    }
    return {
      props: {
        publicUser: null
      }
    };
  } catch (err) {
    log.error('Error fetching public user profile', err);
    return {
      props: {
        publicUser: null
      }
    };
  }
};

export default function UserProfilePage({ publicUser }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [, setPageTitle] = usePageTitle();
  const router = useRouter();
  const userPath = router.query.userPath as string;

  const { data: user, error } = useSWR(`public-profile-${userPath}`, () => charmClient.getUserByPath(userPath));

  useEffect(() => {
    let pageTitle = '';
    if (publicUser) {
      pageTitle = publicUser.username || '';
    }
    setPageTitle(pageTitle);
  }, [publicUser]);

  if (error?.status === 404 || !publicUser) {
    return (
      <Box my={12}>
        <ErrorPage message={"Sorry, that user doesn't exist"} />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>{publicUser.username} | Profile</title>
        <meta
          name='description'
          content={publicUser.profile?.description ?? `Check out ${publicUser.username}'s public CharmVerse profile`}
        />
        <meta
          property='og:description'
          content={publicUser.profile?.description ?? `Check out ${publicUser.username}'s public CharmVerse profile`}
        />
        <meta property='og:title' content={`${publicUser.username} | Profile`} />
        {publicUser.avatar && <meta property='og:image' content={publicUser.avatar} />}
        {publicUser.avatar && <meta property='twitter:image' content={publicUser.avatar} />}

        <meta property='twitter:title' content={`${publicUser.username} | Profile`} />
        <meta
          property='twitter:description'
          content={publicUser.profile?.description ?? `Check out ${publicUser.username}'s public CharmVerse profile`}
        />
      </Head>
      <PublicProfile readOnly={true} user={user ?? publicUser} />
    </>
  );
}

UserProfilePage.getLayout = (page: ReactElement) => {
  return (
    <NexusLayout>
      <CenteredPageContent>{page}</CenteredPageContent>
    </NexusLayout>
  );
};
