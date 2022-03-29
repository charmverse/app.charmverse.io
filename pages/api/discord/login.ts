import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';

const discordClientId = process.env.DISCORD_OAUTH_CLIENT_ID as string;
const discordUrl = `https://discord.com/api/oauth2/authorize?prompt=consent&client_id=${discordClientId}&response_type=code`;

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).get(login);

async function login (req: NextApiRequest, res: NextApiResponse) {
  const query = req.query as {
    redirect: string,
    type: 'connect' | 'server' | 'login'
  };
  const state = encodeURIComponent(JSON.stringify({
    redirect: query.redirect,
    userId: req.session.user.id,
    type: query.type
  }));

  const oauthUrl = `${discordUrl}${query.type === 'server' ? '&scope=guilds' : '&scope=identify'}&state=${state}&redirect_uri=${encodeURIComponent(req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback')}`;
  res.redirect(oauthUrl);
}

export default withSessionRoute(handler);
