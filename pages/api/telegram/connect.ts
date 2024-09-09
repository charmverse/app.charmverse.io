import { log } from '@charmverse/core/log';
import type { TelegramUser } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, InvalidStateError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { TelegramAccount } from 'lib/telegram/interfaces';

const handler = nc({
  onError,
  onNoMatch
});
async function connectTelegram(req: NextApiRequest, res: NextApiResponse<TelegramUser | { message: string }>) {
  const telegramAccount = req.body as TelegramAccount;

  const { id, ...rest } = telegramAccount;
  const userId = req.session.user.id;

  let telegramUser = await prisma.telegramUser.findUnique({
    where: {
      telegramId: id
    }
  });
  if (telegramUser) {
    if (telegramUser.userId !== userId) {
      throw new InvalidStateError(
        'Connection to Telegram failed. Another CharmVerse account is already associated with this Telegram account.'
      );
    }
  } else {
    telegramUser = await prisma.telegramUser.create({
      data: {
        account: rest as any,
        telegramId: id,
        user: {
          connect: {
            id: userId
          }
        }
      }
    });
  }

  res.status(200).json(telegramUser);
}

handler.use(requireUser).post(connectTelegram);

export default withSessionRoute(handler);
