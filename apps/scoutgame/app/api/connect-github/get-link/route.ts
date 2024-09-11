import { getSession } from '@connect-shared/lib/session/getSession';
import { authSecret } from '@root/config/constants';
import { getGithubOAuthCallbackUrl } from '@root/lib/github/oauth';
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
