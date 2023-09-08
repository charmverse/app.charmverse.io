import type { GetServerSideProps } from 'next';

import { LoginPageView } from 'components/login/LoginPage';
import { getDefaultPage, getLastPageView } from 'lib/session/getDefaultPage';
import { withSessionSsr } from 'lib/session/withSession';
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

  const [sortedSpaces, lastPageView] = await Promise.all([
    getSpacesOfUser(sessionUserId),
    getLastPageView(sessionUserId)
  ]);

  let destination = getDefaultPage({ lastPageView, returnUrl, spaces: sortedSpaces, userId: sessionUserId });

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
});

export default function LoginPage() {
  return <LoginPageView />;
}
