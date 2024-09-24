'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from 'lib/actions/actionClient';

import { claimPoints } from './claimPoints';

export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  await claimPoints(ctx.session.user.id);
  revalidatePath('/profile');
  return { success: true };
});
