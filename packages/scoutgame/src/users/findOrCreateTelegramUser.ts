import { log } from '@charmverse/core/log';
import { uuidFromNumber } from '@packages/utils/uuid';
import type { WebAppInitData } from '@twa-dev/types';

import { updateReferralUsers } from '../referrals/updateReferralUsers';

import { findOrCreateUser } from './findOrCreateUser';
import type { FindOrCreateUserResult } from './findOrCreateUser';
import { generateUserPath } from './generateUserPath';

export async function findOrCreateTelegramUser(
  telegramUser: WebAppInitData['user'] & Pick<WebAppInitData, 'start_param'>
): Promise<FindOrCreateUserResult> {
  if (!telegramUser?.id) {
    throw new Error('Missing telegram web app user data');
  }

  const displayName = `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ''}`;

  const user = await findOrCreateUser({
    newUserId: uuidFromNumber(telegramUser.id),
    telegramId: telegramUser.id,
    avatar: telegramUser.photo_url,
    displayName,
    path: await generateUserPath(telegramUser.username || displayName)
  });

  const startParam = telegramUser.start_param;

  if (user?.isNew && startParam?.startsWith('ref_')) {
    const referralCode = startParam.replace('ref_', '').trim();
    const users = await updateReferralUsers(referralCode, user.id).catch((error) => {
      // There can be a case where the referrer is not found. Maybe someone will try to guess referral codes to get rewards.
      log.warn('Error creating referral event.', { error, startParam: telegramUser.start_param, referrerId: user.id });
      return null;
    });

    if (users) {
      const [, referee] = users;

      return { ...referee, isNew: true };
    }
  }

  return user;
}
