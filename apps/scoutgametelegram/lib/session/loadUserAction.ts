'use server';

import { DataNotFoundError } from '@charmverse/core/errors';
import { actionClient } from '@connect-shared/lib/actions/actionClient';
import { getSession } from '@connect-shared/lib/session/getSession';
import { findOrCreateTelegramUser } from '@packages/scoutgame/users/findOrCreateTelegramUser';

import { validateTelegramData } from 'lib/telegram/validate';

import type { SessionUser } from './interfaces';
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

    const user = (await findOrCreateTelegramUser(validatedData.user)) as unknown as SessionUser;

    session.scoutId = user?.id;
    session.anonymousUserId = undefined;
    await session.save();

    return { ...user, telegramId: validatedData.user.id };
  });
