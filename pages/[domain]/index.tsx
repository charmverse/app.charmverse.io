import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getKey } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { getDefaultPageForSpace } from 'lib/session/getDefaultPage';
import { withSessionSsr } from 'lib/session/withSession';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const sessionUserId = context.req.session?.user?.id;

  // 1. handle user not logged in
  if (!sessionUserId) {
    // send user to login
    return {
      redirect: {
        destination: `/?returnUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false
      }
    };
  }

  // retrieve space by domain, and then last page view by spaceId
  const space = await prisma.space.findFirst({
    where: {
      domain: context.query.domain as string
    }
  });

  // 2. Handle when case does not exist
  if (!space) {
    log.warn('User tried to access space that does not exist', { domain: context.query.domain, userId: sessionUserId });
    return {
      redirect: {
        destination: `/join?domain=${context.query.domain}`,
        permanent: false
      }
    };
  }

  // 3. send user to default page for the space

  const destination = await getDefaultPageForSpace({ spaceId: space.id, userId: sessionUserId });

  return {
    redirect: {
      destination: `/${space.domain}${destination}`,
      permanent: false
    }
  };
});

// Redirect users to an initial page
export default function RedirectToMainPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { space } = useCurrentSpace();
  const { pages, loadingPages } = usePages();
  const defaultPageKey: string = space?.domain ? getKey(`last-page-${space.domain}`) : '';
  const defaultPage = defaultPageKey ? typeof window !== 'undefined' && localStorage.getItem(defaultPageKey) : null;

  return null;
}
