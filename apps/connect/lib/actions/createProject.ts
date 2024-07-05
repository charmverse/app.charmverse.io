'use server';

import { authActionClient } from '@connect/lib/actions/actionClient';

import { createConnectProject } from '../projects/createConnectProject';
import type { FormValues } from '../projects/form';
import { schema } from '../projects/form';
import { generateOgImage } from '../projects/generateOgImage';

export const actionCreateProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput as FormValues;
    const currentUserId = ctx.session.user!.id;
    const newProject = await createConnectProject({
      userId: currentUserId,
      input
    });

    await generateOgImage(newProject.id, currentUserId);

    return { success: true };
  });
