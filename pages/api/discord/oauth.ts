import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { isProdEnv, isStagingEnv } from 'config/constants';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';

const discordClientId = process.env.DISCORD_OAUTH_CLIENT_ID as string;
const discordUrl = `https://discord.com/api/oauth2/authorize?prompt=consent&client_id=${discordClientId}&response_type=code`;

const handler = nc({
  onError,
  onNoMatch
});

handler.get(oauth);

async function oauth(req: NextApiRequest, res: NextApiResponse) {
  const query = req.query as {
    redirect: string;
    type: 'connect' | 'server' | 'login';
  };

  const host = req.headers.host;
  const subdomain = getValidSubdomain(host);
  const protocol = isProdEnv || isStagingEnv ? `https://` : `http://`;
  const redirect = subdomain ? `${protocol}${host}${req.query.redirect}` : req.query.redirect;
  const callbackDomain = subdomain ? `${protocol}${host?.replace(subdomain, 'app')}` : `${protocol}${host}`;
  const callbackUrl = `${callbackDomain}/api/discord/callback`;

  const state = encodeURIComponent(
    JSON.stringify({
      redirect,
      type: query.type
    })
  );

  const discordQueryParams = [];
  if (query.type.match(/(connect|login)/)) {
    discordQueryParams.push(...['prompt=consent', 'scope=identify']);
  } else if (query.type === 'server') {
    discordQueryParams.push(...['scope=guilds%20bot', 'permissions=0']);
  }

  const oauthUrl = `${discordUrl}&${discordQueryParams.join('&')}&state=${state}&redirect_uri=${encodeURIComponent(
    callbackUrl
  )}`;

  res.redirect(oauthUrl);
}

export default withSessionRoute(handler);
