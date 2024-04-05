import { log } from '@charmverse/core/log';
import type { TelegramUser } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { app } from 'lib/github/app';
import { onError, InvalidStateError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(connectGithub);

async function connectGithub(req: NextApiRequest, res: NextApiResponse<TelegramUser | { message: string }>) {
  // console.log('req', req.query, req.body);
  const githubAccount = req.body as TelegramAccount;
  // const octokit = await app.getInstallationOctokit(INSTALLATION_ID);
  const { token } = await app.createToken({
    code: 'code123'
  });
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

export default withSessionRoute(handler);
