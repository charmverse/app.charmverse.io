'use server';

import { actionClient } from '@connect/lib/actions/actionClient';
import { revalidatePath } from 'next/cache';

/**
 * Revalidates the main layout data.
 */
export const actionRevalidatePath = actionClient.metadata({ actionName: 'revalidatePath' }).action<void>(async () => {
  revalidatePath('/', 'layout');
});
