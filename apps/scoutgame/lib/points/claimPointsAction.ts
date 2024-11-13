'use server';

import { claimPoints } from '@packages/scoutgame/points/claimPoints';
import { isTestEnv } from '@root/config/constants';
import { revalidatePath } from 'next/cache';

import { authActionClient } from 'lib/actions/actionClient';
import { createUserClaimScreen } from 'lib/users/createUserClaimScreen';

export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  const userId = ctx.session.scoutId;
  const result = await claimPoints({ userId });
  if (!isTestEnv) {
    await createUserClaimScreen(userId);
  }
  revalidatePath('/profile');
  revalidatePath('/claim');
  return { success: true, claimedPoints: result.total };
});
