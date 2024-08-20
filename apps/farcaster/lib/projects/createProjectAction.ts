'use server';

import { revalidatePath } from 'next/cache';

import { actionClient } from '../actionClient';

import { createProject } from './createProject';
import { schema } from './projectSchema';

export const createProjectAction = actionClient.schema(schema).action(async ({ parsedInput }) => {
  const project = await createProject(parsedInput);
  revalidatePath('/product-updates');
  return project;
});
