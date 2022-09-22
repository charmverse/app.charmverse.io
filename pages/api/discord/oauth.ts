import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';

const discordClientId = process.env.DISCORD_OAUTH_CLIENT_ID as string;
const discordUrl = `https://discord.com/api/oauth2/authorize?prompt=consent&client_id=${discordClientId}&response_type=code`;

const handler = nc({
  onError,
  onNoMatch
});

handler.get(oauth);

async function oauth (req: NextApiRequest, res: NextApiResponse) {
  const query = req.query as {
    redirect: string,
    type: 'connect' | 'server' | 'login'
  };
  const state = encodeURIComponent(JSON.stringify({
    redirect: query.redirect,
    type: query.type
  }));

  const discordQueryParams = [];
  if (query.type.match(/(connect|login)/)) {
    discordQueryParams.push(...['prompt=consent', 'scope=identify']);
  }
  else if (query.type === 'server') {
    discordQueryParams.push(...['scope=guilds%20bot', 'permissions=0']);
  }

  const domain = process.env.NODE_ENV === 'development' ? `http://${req.headers.host}` : `https://${req.headers.host}`;
  const oauthUrl = `${discordUrl}&${discordQueryParams.join('&')}&state=${state}&redirect_uri=${encodeURIComponent(`${domain}/api/discord/callback`)}`;
  res.redirect(oauthUrl);
}

export default withSessionRoute(handler);
