import { uuidFromNumber } from '@packages/utils/uuid';

import { findOrCreateUser } from './findOrCreateUser';
import type { FindOrCreateUserResult } from './findOrCreateUser';

export async function findOrCreateTelegramUser(telegramUser: {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}): Promise<FindOrCreateUserResult> {
  if (!telegramUser.id || !telegramUser.username) {
    throw new Error('Missing telegram web app user data');
  }

  return findOrCreateUser({
    newUserId: uuidFromNumber(telegramUser.id),
    telegramId: telegramUser.id,
    avatar: telegramUser.photo_url,
    displayName: `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ''}`,
    path: telegramUser.username
  });
}
