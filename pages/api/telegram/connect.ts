import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionRoute } from 'lib/session/withSession';
import log from 'lib/log';
import { TelegramUser } from '@prisma/client';
import { getUserS3Folder, uploadToS3 } from 'lib/aws/uploadToS3Server';
import { IdentityType } from 'models';

const handler = nc({
  onError,
  onNoMatch
});

export interface TelegramAccount {
  auth_date: number
  first_name: string
  hash: string
  id: number
  last_name: string
  photo_url: string
  username: string
}

async function connectTelegram (req: NextApiRequest, res: NextApiResponse<TelegramUser | {error: string}>) {
  const telegramAccount = req.body as TelegramAccount;

  const { id, ...rest } = telegramAccount;
  const userId = req.session.user.id;
  let telegramUser: TelegramUser;

  try {
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

    const avatar = (await uploadToS3({ fileName: getUserS3Folder({ userId, url: telegramAccount.photo_url }), url: telegramAccount.photo_url })).url;
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        username: telegramAccount.username,
        avatar: telegramAccount.photo_url,
        identityType: IdentityType.Telegram
      }
    });
  }
  catch (error) {
    log.warn('Error while connecting to Telegram', error);
    // If the telegram user is already connected to a charmverse account this code will be run
    res.status(400).json({
      error: 'Connection to Telegram failed. Another CharmVerse account is already associated with this Telegram account.'
    });
    return;
  }

  res.status(200).json(telegramUser);
}

handler.use(requireUser).post(connectTelegram);

export default withSessionRoute(handler);
