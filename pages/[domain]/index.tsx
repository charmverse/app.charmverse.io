import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps } from 'next';

import { LoginPageView } from 'components/login/LoginPage';
import { getDefaultPageForSpace } from 'lib/session/getDefaultPageForSpace';
import { withSessionSsr } from 'lib/session/withSession';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const sessionUserId = context.req.session?.user?.id;
  // 1. handle user not logged in
  if (!sessionUserId) {
    // show the normal login UI
    return {
      props: {}
    };
  }

  // retrieve space by domain, and then last page view by spaceId
  const domainOrCustomDomain = context.query.domain as string;
  const space = await prisma.space.findFirst({
    where: {
      OR: [
        {
          // TODO: ask Marek why we need to support case-insensitivity for custom domains
          customDomain: {
            equals: domainOrCustomDomain,
            mode: 'insensitive'
          }
        },
        { domain: domainOrCustomDomain }
      ]
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

  let destination = await getDefaultPageForSpace({ host: context.req.headers.host, space, userId: sessionUserId });
  // encode to handle Japanese characters
  destination = encodeURI(destination);
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
export default function LoginPage() {
  return <LoginPageView />;
}
