import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps } from 'next';

import { getDefaultPageForSpace } from 'lib/session/getDefaultPageForSpace';
import { withSessionSsr } from 'lib/session/withSession';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const sessionUserId = context.req.session?.user?.id;

  // 1. handle user not logged in
  if (!sessionUserId) {
    // send user to login
    log.debug('Send user to login page', { domain: context.query.domain, userId: sessionUserId });
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

  let destination = await getDefaultPageForSpace({ space, userId: sessionUserId });

  // append existing query params, lie 'account' or 'subscription'
  Object.keys(context.query).forEach((key) => {
    if (key !== 'returnUrl' && key !== 'domain') {
      destination += `${destination.includes('?') ? '&' : '?'}${key}=${context.query[key]}`;
    }
  });

  return {
    redirect: {
      destination,
      permanent: false
    }
  };
});

// Next.js requires a component
export default function PageStub() {
  return null;
}
