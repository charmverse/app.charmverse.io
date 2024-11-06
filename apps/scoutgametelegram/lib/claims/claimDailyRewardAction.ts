'use server';

import { revalidatePath } from 'next/cache';

import { actionClient } from 'lib/actions/actionClient';
import { getUserFromSession } from 'lib/session/getUserFromSession';
import type { SessionUser } from 'lib/session/interfaces';

import { claimDailyReward } from './claimDailyReward';
import { claimDailyRewardSchema } from './claimDailyRewardSchema';

export const claimDailyRewardAction = actionClient.schema(claimDailyRewardSchema).action(async ({ parsedInput }) => {
  const user = (await getUserFromSession()) as SessionUser;
  await claimDailyReward({ userId: user.id, isBonus: parsedInput.isBonus });
  revalidatePath('/quests');
});
