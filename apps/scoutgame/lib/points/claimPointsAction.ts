'use server';

import { claimPoints } from '@packages/scoutgame/points/claimPoints';
import { revalidatePath } from 'next/cache';

import { authActionClient } from 'lib/actions/actionClient';

export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  const result = await claimPoints({ userId: ctx.session.scoutId });
  revalidatePath('/profile');
  revalidatePath('/claim', 'layout');
  return { success: true, claimedPoints: result.total };
});
