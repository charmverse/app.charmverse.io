'use server';

import { authActionClient } from '@connect/lib/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { editConnectProject } from '../projects/editConnectProject';
import type { FormValues } from '../projects/form';
import { schema } from '../projects/form';
import { generateOgImage } from '../projects/generateOgImage';

export const actionEditProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;
    const currentUserId = ctx.session.user!.id;
    const editedProject = await editConnectProject({
      userId: currentUserId,
      input: input as FormValues & {
        projectId: string;
      }
    });

    await generateOgImage(editedProject.id, currentUserId);

    revalidatePath(`/p/${editedProject.path}`);

    return { success: true };
  });
