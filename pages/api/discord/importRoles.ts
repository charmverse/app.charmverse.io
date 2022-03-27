import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import log from 'lib/log';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import * as http from 'adapters/http';

const handler = nc({
  onError,
  onNoMatch
});

const discordBotToken = process.env.DISCORD_BOT_TOKEN as string;

export interface ImportRolesPayload {
  spaceId: string,
  guildId: string
}

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

handler.post(async (req: NextApiRequest, res: NextApiResponse) => {
  const { spaceId, guildId } = req.body as ImportRolesPayload;
  try {
    await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        discordServerId: guildId
      }
    });

    const discordServerRoles = await http.GET<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${guildId}/roles`, undefined, {
      headers: {
        Authorization: `Bot ${discordBotToken}`
      }
    });

    console.log({ discordServerRoles });

    res.status(200).end();
  }
  catch (err) {
    log.warn('Failed to connect workspace with discord server', err);
    res.status(500).end();
  }
});

export default handler;
