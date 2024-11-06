'use server';

import { DataNotFoundError } from '@charmverse/core/errors';
import type { FarcasterUser, Scout } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { actionClient } from '@connect-shared/lib/actions/actionClient';
import { getSession } from '@connect-shared/lib/session/getSession';
import { randomName } from '@root/lib/utils/randomName';
import { replaceS3Domain } from '@root/lib/utils/url';

import { validateTelegramData } from 'lib/telegram/validate';

import { userActionSchema } from './getUserActionSchema';

export type LoggedInUser = Scout & {
  farcasterUser?: FarcasterUser | null;
};

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const loadUser = actionClient
  .metadata({ actionName: 'getCurrentUser' })
  .schema(userActionSchema)
  .action<LoggedInUser | null>(async ({ parsedInput }) => {
    const session = await getSession();
    let user: undefined | Scout;
    const initData = parsedInput.initData;

    if (!TELEGRAM_BOT_TOKEN) {
      throw new DataNotFoundError('Telegram bot token is not set');
    }

    const validatedData = validateTelegramData(initData, TELEGRAM_BOT_TOKEN, { expiresIn: 3600 });

    if (!validatedData.user?.id) {
      throw new DataNotFoundError('No telegram user id found');
    }

    const telegramUser = await prisma.scoutTelegramUser.findFirst({
      where: {
        telegramId: validatedData?.user?.id
      },
      include: {
        scout: true
      }
    });

    user = telegramUser?.scout;

    if (!user) {
      const telegramUsername =
        validatedData?.user?.username ||
        `${validatedData?.user?.first_name} ${validatedData?.user?.last_name}` ||
        randomName();

      const newUser = await prisma.scout.create({
        data: {
          displayName: validatedData?.user?.username || '',
          path: telegramUsername,
          telegramUser: {
            create: {
              telegramId: validatedData?.user?.id,
              username: validatedData?.user?.username || ''
            }
          }
        }
      });

      user = newUser;
    }

    if (user?.avatar) {
      user.avatar = replaceS3Domain(user.avatar);
    }

    session.scoutId = user.id;
    await session.save();

    return user;
  });
