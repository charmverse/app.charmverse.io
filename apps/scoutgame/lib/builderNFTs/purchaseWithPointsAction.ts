'use server';

import { claimPoints } from '@packages/scoutgame/claimPoints';
import { revalidatePath } from 'next/cache';

import { authActionClient } from 'lib/actions/actionClient';

export const purchaseWithPointsAction = authActionClient
  .metadata({ actionName: 'purchase_with_points' })
  .action(async ({ ctx }) => {
    await claimPoints(ctx.session.scoutId);
    revalidatePath('/profile');
    return { success: true };
  });
