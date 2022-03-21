import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import * as http from 'adapters/http';
import { DiscordUser } from 'hooks/useDiscordUser';

const handler = nc({
  onError,
  onNoMatch
});

const DISCORD_OAUTH_TOKEN_ENDPOINT = 'https://discord.com/api/v8/oauth2/token';
const DISCORD_OAUTH_CLIENT_ID = process.env.DISCORD_OAUTH_CLIENT_ID as string;
const DISCORD_OAUTH_CLIENT_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET as string;

handler.get(async (req, res) => {
  const tempAuthCode = req.query.code as string;
  if (req.query.error || !tempAuthCode) {
    console.log('Error or missing code from Discord OAuth. Response query:', req.query);
    res.redirect('/');
    return;
  }

  let state: {
    href: string,
  } = {} as any;
  try {
    state = JSON.parse(decodeURIComponent(req.query.state as string));
  }
  catch (e) {
    console.error('Error parsing discord state', e);
    res.status(400).send({ error: 'Invalid state' });
    return;
  }

  const params = new URLSearchParams();
  params.append('client_id', DISCORD_OAUTH_CLIENT_ID);
  params.append('client_secret', DISCORD_OAUTH_CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', tempAuthCode);
  params.append('redirect_uri', req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');

  const token = await http.POST(DISCORD_OAUTH_TOKEN_ENDPOINT, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    skipStringifying: true
  }) as {access_token: string, expires_in: number, refresh_token: string, scope: string, token_type: string};

  const discordAccount = await http.GET<DiscordUser>('https://discord.com/api/v8/users/@me', undefined, {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });

  res.redirect(state.href);
});

export default handler;
