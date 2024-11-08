'use server';

import { claimPoints } from '@packages/scoutgame/points/claimPoints';

import { authActionClient } from 'lib/actions/actionClient';

export const claimPointsAction = authActionClient.metadata({ actionName: 'claim_points' }).action(async ({ ctx }) => {
  const result = await claimPoints({ userId: ctx.session.scoutId });
  return { success: true, claimedPoints: result.total };
});
