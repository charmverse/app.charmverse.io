import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps } from 'next';

import { LoginPageView } from 'components/login/LoginPage';
import { getDefaultPageForSpace } from '@packages/lib/session/getDefaultPageForSpace';
import { withSessionSsr } from '@packages/lib/session/withSession';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const sessionUserId = context.req.session?.user?.id;

  // retrieve space by domain, and then last page view by spaceId
  const domainOrCustomDomain = context.query.domain as string;

  const space = await prisma.space.findFirst({
    where: {
      OR: [
        {
          customDomain: domainOrCustomDomain
        },
        { domain: domainOrCustomDomain }
      ]
    }
  });

  // 1. Handle when case does not exist
  if (!space) {
    log.warn('User tried to access space that does not exist', { domain: context.query.domain, userId: sessionUserId });
    return {
      redirect: {
        destination: `/join?domain=${context.query.domain}`,
        permanent: false
      }
    };
  }

  // 2. send user to default page for the space

  const pageRedirect = await getDefaultPageForSpace({ host: context.req.headers.host, space, userId: sessionUserId });

  if (pageRedirect == null) {
    return {
      props: {}
    };
  }

  let destination = pageRedirect;

  // append existing query params, lie 'account' or 'subscription'
  Object.keys(context.query).forEach((key) => {
    if (key !== 'returnUrl' && key !== 'domain') {
      destination += `${destination.includes('?') ? '&' : '?'}${key}=${context.query[key]}`;
    }
  });

  log.info('Redirecting user to default page in space', {
    destination,
    domain: domainOrCustomDomain
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
