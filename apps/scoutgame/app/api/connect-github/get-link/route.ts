import { getSession } from '@connect-shared/lib/session/getSession';
import { getGithubOAuthCallbackUrl } from '@packages/github/oauth';
import { authSecret } from '@root/config/constants';
import { GITHUB_CLIENT_ID } from '@root/lib/github/constants';
import { sealData } from 'iron-session';

export async function GET() {
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

  const redirectUrl = getGithubOAuthCallbackUrl({
    clientId: GITHUB_CLIENT_ID,
    redirect: `${process.env.DOMAIN}/api/connect-github/callback`,
    state: sealedUserId
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl
    }
  });
}
