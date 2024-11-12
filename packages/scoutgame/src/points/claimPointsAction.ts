'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '../actions/actionClient';

import { claimPoints } from './claimPoints';

export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  const result = await claimPoints({ userId: ctx.session.scoutId! });
  revalidatePath('/profile');
  revalidatePath('/claim');
  return { success: true, claimedPoints: result.total };
});
