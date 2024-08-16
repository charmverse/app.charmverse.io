'use server';

import { schema } from '@connect-shared/lib/projects/form';
import { revalidatePath } from 'next/cache';

import { actionClient } from '../actionClient';

import { createProject } from './createProject';

export const createProjectAction = actionClient.schema(schema).action(async ({ parsedInput }) => {
  const project = await createProject(parsedInput);
  revalidatePath('/product-updates');
  return project;
});
