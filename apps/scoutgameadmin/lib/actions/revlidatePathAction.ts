'use server';

import { revalidatePath } from 'next/cache';

import { actionClient } from './actionClient';

/**
 * Revalidates the main layout data.
 */
export const revalidatePathAction = actionClient.metadata({ actionName: 'revalidatePath' }).action<void>(async () => {
  revalidatePath('/', 'layout');
});
