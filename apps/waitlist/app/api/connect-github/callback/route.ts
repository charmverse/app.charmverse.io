import { prisma } from '@charmverse/core/prisma-client';
import { GET as httpGET, POST as httpPOST } from '@root/adapters/http';
import { authSecret } from '@root/config/constants';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '@root/lib/github/constants';
import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';

import { embedFarcasterUser } from 'lib/frame/actionButtons';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const error = searchParams.get('error');

  if (error) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/builders?connect_error=${encodeURIComponent('Connection cancelled')}`
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
        Location: `/builders?connect_error=${encodeURIComponent('Invalid connection url')}`
      }
    });
  }

  const unsealedFid = await unsealData<{ fid: string }>(state, { password: authSecret as string }).then(
    (data) => data?.fid as string
  );

  if (!unsealedFid) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.DOMAIN}/builders?connect_error=${encodeURIComponent('User required')}`
      }
    });
  }

  const connectWaitlistSlot = await prisma.connectWaitlistSlot.findUnique({
    where: {
      fid: parseInt(unsealedFid)
    }
  });

  if (!connectWaitlistSlot) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.DOMAIN}/builders?connect_error=${encodeURIComponent('User not found')}`
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
        Location: `${process.env.DOMAIN}/builders?connect_error=${encodeURIComponent(
          'Failed to authenticate Github account'
        )}`
      }
    });
  }

  // Fetch the GitHub user's info
  const userResponse = await httpGET<{ login: string }>('https://api.github.com/user', undefined, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const githubLogin = userResponse.login;

  if (!githubLogin) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.DOMAIN}/builders?connect_error=${encodeURIComponent('Failed to fetch Github user')}`
      }
    });
  }

  const existingConnection = await prisma.connectWaitlistSlot.findFirst({
    where: {
      githubLogin
    }
  });

  if (existingConnection?.githubLogin && existingConnection.fid !== connectWaitlistSlot.fid) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.DOMAIN}/builders?connect_error=${encodeURIComponent('Account is already in use')}`
      }
    });
  }

  await prisma.connectWaitlistSlot.update({
    where: {
      fid: connectWaitlistSlot.fid
    },
    data: {
      githubLogin
    }
  });

  const sealedData = await embedFarcasterUser({
    fid: connectWaitlistSlot.fid.toString(),
    username: connectWaitlistSlot.username,
    hasJoinedWaitlist: true
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${process.env.DOMAIN}/score?${sealedData}`
    }
  });
}
