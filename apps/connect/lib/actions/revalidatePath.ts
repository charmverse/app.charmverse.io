'use server';

import { revalidatePath } from 'next/cache';

import { actionClient } from 'lib/actions/actionClient';

/**
 * Revalidates the main layout data.
 */
export const actionRevalidatePath = actionClient.metadata({ actionName: 'revalidatePath' }).action<void>(async () => {
  revalidatePath('/', 'layout');
});
