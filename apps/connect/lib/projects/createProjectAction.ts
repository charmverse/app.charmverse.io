'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { schema } from 'components/projects/utils/form';
import { authActionClient } from 'lib/actions/actionClient';

export const actionCreateProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .action(async ({ parsedInput, ctx }) => {
    revalidatePath('/projects');
  });
