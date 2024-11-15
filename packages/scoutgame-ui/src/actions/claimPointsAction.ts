'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { claimPoints } from '@packages/scoutgame/points/claimPoints';
import { isTestEnv } from '@packages/utils/constants';
import { revalidatePath } from 'next/cache';

import { createUserClaimScreen } from './createUserClaimScreen';

// This action needs to be in the scoutgame-ui package because it uses the createUserClaimScreen function which imports components from the scoutgame-ui package
export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  const userId = ctx.session.scoutId;
  // Skip generating claim screen in test environment
  if (!isTestEnv) {
    await createUserClaimScreen(userId);
  }
  const result = await claimPoints({ userId });
  revalidatePath('/profile');
  revalidatePath('/claim');
  return { success: true, claimedPoints: result.total };
});
