import { log } from '@charmverse/core/log';
import { getDefaultPage, getLastViewedSpaceId } from '@packages/lib/session/getDefaultPage';
import { withSessionSsr } from '@packages/lib/session/withSession';
import type { GetServerSideProps } from 'next';

import { LoginPageView } from 'components/login/LoginPage';
import { getSpacesOfUser } from 'lib/spaces/getSpacesOfUser';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const returnUrl = typeof context.query.returnUrl === 'string' ? context.query.returnUrl : undefined;
  const sessionUserId = context.req.session?.user?.id;

  if (!sessionUserId) {
    // show the normal login UI
    return {
      props: {}
    };
  }

  try {
    const [sortedSpaces, lastPageView] = await Promise.all([
      getSpacesOfUser(sessionUserId),
      getLastViewedSpaceId({ userId: sessionUserId })
    ]);

    let destination = getDefaultPage({
      lastViewedSpaceId: lastPageView?.spaceId,
      returnUrl,
      spaces: sortedSpaces,
      userId: sessionUserId,
      host: context.req.headers.host
    });

    // append existing query params, lie 'account' or 'subscription'
    Object.keys(context.query).forEach((key) => {
      if (key !== 'returnUrl') {
        destination += `${destination.includes('?') ? '&' : '?'}${key}=${context.query[key]}`;
      }
    });

    return {
      redirect: {
        destination,
        permanent: false
      }
    };
  } catch (error) {
    log.error('Error getting spaces for user', { error });
    return {
      props: {}
    };
  }
});

export default function LoginPage() {
  return <LoginPageView />;
}
