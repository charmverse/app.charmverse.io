import { log } from '@charmverse/core/log';
import { uuidFromNumber } from '@packages/utils/uuid';

import { createReferralEvent } from '../referrals/createReferralEvent';

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
  start_param?: string;
}): Promise<FindOrCreateUserResult> {
  if (!telegramUser.id || !telegramUser.username) {
    throw new Error('Missing telegram web app user data');
  }

  const user = await findOrCreateUser({
    newUserId: uuidFromNumber(telegramUser.id),
    telegramId: telegramUser.id,
    avatar: telegramUser.photo_url,
    displayName: `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ''}`,
    path: telegramUser.username
  });

  if (user?.isNew && telegramUser.start_param) {
    await createReferralEvent(telegramUser.start_param, user.id).catch((error) => {
      // There can be a case where the referrer is not found. Maybe someone will try to guess referral codes to get rewards.
      log.warn('Error creating referral event.', { error, startParam: telegramUser.start_param, referrerId: user.id });
    });
  }

  return user;
}
