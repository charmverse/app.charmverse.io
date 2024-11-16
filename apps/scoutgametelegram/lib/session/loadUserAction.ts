'use server';

import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { actionClient } from '@packages/scoutgame/actions/actionClient';
import { findOrCreateTelegramUser } from '@packages/scoutgame/users/findOrCreateTelegramUser';

import { getUserAvatar } from 'lib/telegram/getUserAvatar';
import { validateTelegramData } from 'lib/telegram/validate';

import { getSession } from './getSession';
import { userActionSchema } from './loadUserActionSchema';

export const loadUser = actionClient
  .metadata({ actionName: 'getCurrentUser' })
  .schema(userActionSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession();
    const initData = parsedInput.initData;

    const validatedData = validateTelegramData(initData, { expiresIn: 3600 });

    if (!validatedData.user?.id) {
      throw new DataNotFoundError('No telegram user id found');
    }

    const avatar = await getUserAvatar(validatedData.user.id).catch((error) => {
      log.info('Error getting telegram avatar', { error });
      return null;
    });

    const user = await findOrCreateTelegramUser({
      ...validatedData.user,
      photo_url: avatar ?? undefined,
      start_param: validatedData?.start_param
    });

    session.scoutId = user?.id;
    session.anonymousUserId = undefined;
    await session.save();

    return { ...user, telegramId: validatedData.user.id };
  });
