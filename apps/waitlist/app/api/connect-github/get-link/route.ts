import { getGithubOAuthCallbackUrl } from '@packages/github/oauth';
import { authSecret } from '@root/config/constants';
import { GITHUB_CLIENT_ID } from '@root/lib/github/constants';
import { sealData } from 'iron-session';

import { getSession } from 'lib/session/getSession';

export async function GET() {
  const session = await getSession();

  if (!session.farcasterUser?.fid) {
    return new Response('Authentication required', { status: 401 });
  }

  const sealedFID = await sealData(
    {
      fid: session.farcasterUser.fid
    },
    { password: authSecret as string }
  );

  const redirectUrl = getGithubOAuthCallbackUrl({
    clientId: GITHUB_CLIENT_ID,
    redirect: `${process.env.DOMAIN}/api/connect-github/callback`,
    state: sealedFID
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}
