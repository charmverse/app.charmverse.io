import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import * as http from 'adapters/http';
import { prisma } from 'db';

const discordBotToken = process.env.DISCORD_BOT_TOKEN as string;

export interface DiscordServerRole {
  id: string
  name: string
  color: number
  hoist: boolean
  icon?: string
  position: number
  permissions: string
  managed: boolean
  mentionable: boolean
  tags?: {
    bot_id?: string
    integration_id?: string
  }[]
}

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const { spaceId } = req.query as {spaceId: string};

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!space) {
    res.status(404).send({ error: "Space doesn't exist" });
  }
  else {
    const { discordServerId } = space;
    if (!discordServerId) {
      res.status(400).send({ error: 'Space is not connected with any discord server' });
    }
    else {
      try {
        const discordServerRoles = await http.GET<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${discordServerId}/roles`, undefined, {
          headers: {
            Authorization: `Bot ${discordBotToken}`
          }
        });
        res.status(200).send({ roles: discordServerRoles });
      }
      catch (err) {
        // TODO: Handle cases where the bot token is invalid and the bot hasn't been added to the server
        console.log(err);
        res.status(400).end();
      }
    }
  }

});

export default handler;
