
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import * as http from 'adapters/http';
import { DiscordUser } from 'hooks/useDiscordUser';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).get(login);

async function login (req: NextApiRequest, res: NextApiResponse<DiscordUser>) {
  const discordAccount = await http.GET<DiscordUser>('https://discord.com/api/v8/users/@me', undefined, {
    headers: {
      Authorization: `Bearer ${req.cookies['discord-access-token']}`
    }
  });

  return res.status(200).send(discordAccount);
}

export default withSessionRoute(handler);
