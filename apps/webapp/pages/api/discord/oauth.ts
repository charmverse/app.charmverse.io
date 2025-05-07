import { isTestEnv } from '@packages/config/constants';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getDiscordCallbackUrl } from '@packages/lib/discord/getDiscordCallbackUrl';
import { getDiscordRedirectUrl } from '@packages/lib/discord/getDiscordRedirectUrl';
import { onError, onNoMatch } from '@packages/lib/middleware';
import type { AuthType, OauthFlowType } from '@packages/lib/oauth/interfaces';
import { withSessionRoute } from '@packages/lib/session/withSession';

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
    type: AuthType;
    authFlowType?: OauthFlowType;
  };

  const authFlowType = query.authFlowType ?? 'popup';
  const host = req.headers.host;
  const redirect = getDiscordRedirectUrl(host, query.redirect);
  const callbackUrl = getDiscordCallbackUrl(host, authFlowType);

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
