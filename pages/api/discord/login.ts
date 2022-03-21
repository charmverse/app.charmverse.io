import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';

const discordClientId = process.env.DISCORD_OAUTH_CLIENT_ID as string;
const discordUrl = `https://discord.com/api/oauth2/authorize?prompt=consent&client_id=${discordClientId}&scope=identify&response_type=code`;

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).get(login);

async function login (req: NextApiRequest, res: NextApiResponse) {
  // TODO: Add state query params
  const oauthUrl = `${discordUrl}&redirect_uri=${encodeURIComponent(req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback')}`;
  res.send({ redirectUrl: oauthUrl });
}

export default withSessionRoute(handler);
