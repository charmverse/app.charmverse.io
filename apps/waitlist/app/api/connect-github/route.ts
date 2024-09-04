import { POST as httpPOST, GET as httpGET } from '@root/adapters/http';
import { prettyPrint } from '@root/lib/utils/strings';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  // console.log('searchParams', searchParams);

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
    return NextResponse.json({ error: 'Access token missing' }, { status: 400 });
  }

  // Fetch the GitHub user's info
  const userResponse = await httpGET('https://api.github.com/user', undefined, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  // console.log('-------- RESULT --------');
  prettyPrint(userResponse);

  return NextResponse.redirect(`/builders`);
}
