import { getSession } from '@connect-shared/lib/session/getSession';
import { authSecret } from '@root/config/constants';
import { GITHUB_CLIENT_ID } from '@root/lib/github/constants';
import { sealData } from 'iron-session';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session.user?.id) {
    return new Response('Authentication required', { status: 401 });
  }

  const sealedUserId = await sealData(
    {
      id: session.user.id
    },
    { password: authSecret as string }
  );

  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    `${process.env.DOMAIN}/api/connect-github/callback`
  )}&state=${encodeURIComponent(sealedUserId)}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}
