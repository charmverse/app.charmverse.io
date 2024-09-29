import { getSession } from '@connect-shared/lib/session/getSession';
import { getGithubOAuthCallbackUrl } from '@packages/github/oauth';
import { authSecret } from '@root/config/constants';
import { GITHUB_CLIENT_ID } from '@root/lib/github/constants';
import { sealData } from 'iron-session';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const onboarding = req.nextUrl.searchParams.get('onboarding');
  if (!session.scoutId) {
    return new Response('Authentication required', { status: 401 });
  }

  const sealedUserId = await sealData(
    {
      id: session.scoutId
    },
    { password: authSecret as string }
  );

  const redirectUrl = getGithubOAuthCallbackUrl({
    clientId: GITHUB_CLIENT_ID,
    redirect: `${process.env.DOMAIN}/api/connect-github/callback?onboarding=${onboarding}`,
    state: sealedUserId
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}
