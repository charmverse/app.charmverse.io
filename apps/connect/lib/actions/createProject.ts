'use server';

import { authActionClient } from '@connect/lib/actions/actionClient';

import { createConnectProject } from '../projects/createConnectProject';
import type { FormValues } from '../projects/form';
import { schema } from '../projects/form';

export const actionCreateProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput as FormValues;
    const currentUserId = ctx.session.user!.id;
    await createConnectProject({
      userId: currentUserId,
      input
    });

    return { success: true };
  });
