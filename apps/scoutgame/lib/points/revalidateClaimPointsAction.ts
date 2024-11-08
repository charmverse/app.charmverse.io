'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from 'lib/actions/actionClient';

export const revalidateClaimPointsAction = authActionClient
  .metadata({ actionName: 'revalidate_claim_points' })
  .action<void>(async () => {
    revalidatePath('/profile');
    revalidatePath('/claim');
  });
