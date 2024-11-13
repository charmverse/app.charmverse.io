'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { claimPoints } from '@packages/scoutgame/points/claimPoints';
import { isTestEnv } from '@packages/utils/constants';

import { createUserClaimScreen } from './createUserClaimScreen';

export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  const userId = ctx.session.scoutId;
  const result = await claimPoints({ userId });
  // Skip generating claim screen in test environment
  if (!isTestEnv) {
    await createUserClaimScreen(userId);
  }
  return { success: true, claimedPoints: result.total };
});
