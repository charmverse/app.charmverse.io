import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import * as http from 'adapters/http';
import { prisma } from 'db';
import log from 'lib/log';
import { getDiscordToken } from 'lib/discord/getDiscordToken';

export interface DiscordUserServer {
  id: string
  name: string
  icon: string
  owner: boolean
  permissions: string
  features: string[]
}

const handler = nc({
  onError,
  onNoMatch
});

handler.post(async (req, res) => {
  const tempAuthCode = req.body.code as string;
  if (!tempAuthCode) {
    log.warn('Error or missing code from Discord OAuth. Response query:', req.query);
    res.redirect('/');
    return;
  }

  try {
    const token = await getDiscordToken(tempAuthCode, req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');
    const discordUserServers = await http.GET<DiscordUserServer[]>('https://discord.com/api/v8/users/@me/guilds', undefined, {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    });
    res.status(200).send({ servers: discordUserServers });
  }
  catch (err) {
    res.status(500).send({ error: 'Invalid token' });
  }
});

export default handler;
