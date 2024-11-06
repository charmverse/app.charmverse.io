'use server';

import { revalidatePath } from 'next/cache';

import { actionClient } from 'lib/actions/actionClient';
import type { SessionUser } from 'lib/session/getUserFromSession';
import { getUserFromSession } from 'lib/session/getUserFromSession';

import { claimDailyReward } from './claimDailyReward';
import { claimDailyRewardSchema } from './claimDailyRewardSchema';

export const claimDailyRewardAction = actionClient.schema(claimDailyRewardSchema).action(async ({ parsedInput }) => {
  const user = (await getUserFromSession()) as SessionUser;
  await claimDailyReward({ userId: user.id, isBonus: parsedInput.isBonus });
  revalidatePath('/quests');
});
