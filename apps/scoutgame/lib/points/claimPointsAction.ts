'use server';

import { claimPoints } from '@packages/scoutgame/points/claimPoints';

import { authActionClient } from 'lib/actions/actionClient';
import { createUserClaimScreen } from 'lib/users/createUserClaimScreen';

export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  const userId = ctx.session.scoutId;
  const result = await claimPoints({ userId });
  await createUserClaimScreen(userId);
  return { success: true, claimedPoints: result.total };
});
