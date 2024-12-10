import { getGithubOAuthCallbackUrl } from '@packages/github/oauth';
import { getSession } from '@packages/scoutgame/session/getSession';
import { authSecret, GITHUB_CLIENT_ID } from '@packages/utils/constants';
import { sealData } from 'iron-session';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const redirectToProfile = req.nextUrl.searchParams.get('profile-redirect');
  if (!session.scoutId) {
    return new Response('Authentication required', { status: 401 });
  }

  const sealedUserId = await sealData(
    {
      id: session.scoutId
    },
    { password: authSecret as string }
  );

  const redirect = `${process.env.DOMAIN}/builder-registration-callback`;

  const redirectUrl = getGithubOAuthCallbackUrl({
    clientId: GITHUB_CLIENT_ID,
    redirect: redirectToProfile ? `${redirect}?profile-redirect=${redirectToProfile}` : redirect,
    state: sealedUserId
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}
