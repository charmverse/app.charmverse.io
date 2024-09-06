import { authSecret } from '@root/config/constants';
import { getGithubOAuthCallbackUrl } from '@root/lib/github/oauth';
import { sealData } from 'iron-session';
import type { NextRequest } from 'next/server';

import { getSession } from 'lib/session/getSession';

export async function GET(req: NextRequest) {
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
