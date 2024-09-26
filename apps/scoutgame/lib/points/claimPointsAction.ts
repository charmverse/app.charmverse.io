'use server';

import { claimPoints } from '@packages/scoutgame/claimPoints';
import { revalidatePath } from 'next/cache';

import { authActionClient } from 'lib/actions/actionClient';

export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  await claimPoints(ctx.session.scoutId);
  revalidatePath('/profile');
  return { success: true };
});