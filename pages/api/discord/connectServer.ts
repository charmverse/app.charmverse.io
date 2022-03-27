import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import log from 'lib/log';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';

const handler = nc({
  onError,
  onNoMatch
});

export interface ConnectServerPayload {
  spaceId: string,
  guildId: string
}

handler.post(async (req: NextApiRequest, res: NextApiResponse) => {
  const { spaceId, guildId } = req.body as ConnectServerPayload;
  try {
    await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        discordServerId: guildId
      }
    });
    res.status(200).end();
  }
  catch (err) {
    log.warn('Failed to connect workspace with discord server', err);
    res.status(500).end();
  }
});

export default handler;
