import log from 'lib/log';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import * as http from 'adapters/http';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';

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

async function importRoles (req: NextApiRequest, res: NextApiResponse) {
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

    for (const discordServerRole of discordServerRoles) {
      if (discordServerRole.name !== '@everyone') {
        const existingRole = await prisma.role.findFirst({
          where: {
            name: discordServerRole.name,
            spaceId
          }
        });

        // Only create the role if it doesn't already exist
        if (!existingRole) {
          await prisma.role.create({
            data: {
              name: discordServerRole.name,
              space: {
                connect: {
                  id: spaceId
                }
              },
              createdBy: req.session.user?.id
            }
          });
        }
      }
    }

    res.status(200).end();
  }
  catch (err) {
    log.warn('Failed to connect workspace with discord server', err);
    res.status(500).end();
  }
}

handler.use(requireUser).post(importRoles);

export default withSessionRoute(handler);
