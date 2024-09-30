import { prisma } from '@charmverse/core/prisma-client';
import { GET as httpGET, POST as httpPOST } from '@root/adapters/http';
import { authSecret } from '@root/config/constants';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '@root/lib/github/constants';
import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';

function generateRedirectUrl(errorMessage: string) {
  return `${process.env.DOMAIN}/welcome/builder?connect_error=${encodeURIComponent(errorMessage)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const onboarding = searchParams.get('onboarding');

  const error = searchParams.get('error');

  if (error) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: generateRedirectUrl('Connection cancelled')
      }
    });
  }

  const code = searchParams.get('code');
  const clientId = GITHUB_CLIENT_ID;
  const clientSecret = GITHUB_CLIENT_SECRET;

  const state = searchParams.get('state');

  if (!state) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: generateRedirectUrl('Invalid connection url')
      }
    });
  }

  const unsealedUserId = await unsealData<{ id: string }>(state, { password: authSecret as string }).then(
    (data) => data?.id as string
  );

  if (!unsealedUserId) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: generateRedirectUrl('User required')
      }
    });
  }

  const exists = await prisma.scout.count({
    where: {
      id: unsealedUserId
    }
  });

  if (!exists) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: generateRedirectUrl('User not found')
      }
    });
  }

  const tokenData = await httpPOST<{ access_token: string }>(
    `https://github.com/login/oauth/access_token`,
    {
      client_id: clientId,
      client_secret: clientSecret,
      code
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: generateRedirectUrl('Failed to authenticate Github account')
      }
    });
  }

  // Fetch the GitHub user's info
  const userResponse = await httpGET<{ login: string; name: string; email: string; id: number }>(
    'https://api.github.com/user',
    undefined,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  const githubLogin = userResponse.login;

  if (!githubLogin) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: generateRedirectUrl('Failed to fetch Github user')
      }
    });
  }

  // Check existing github connection
  // const existingConnection = await prisma.connectWaitlistSlot.findFirst({
  //   where: {
  //     githubLogin
  //   }
  // });

  // if (existingConnection?.githubLogin && existingConnection.fid !== connectWaitlistSlot.fid) {
  //   return new Response(null, {
  //     status: 302,
  //     headers: {
  //       Location: `${process.env.DOMAIN}/builders?connect_error=${encodeURIComponent('Account is already in use')}`
  //     }
  //   });
  // }

  await prisma.scout.update({
    where: {
      id: unsealedUserId
    },
    data: {
      onboardedAt: new Date(),
      githubUser: {
        create: {
          login: githubLogin,
          displayName: userResponse.name,
          email: userResponse.email,
          id: userResponse.id
        }
      }
    }
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${process.env.DOMAIN}/welcome/spam-policy?onboarding=${onboarding}`
    }
  });
}
