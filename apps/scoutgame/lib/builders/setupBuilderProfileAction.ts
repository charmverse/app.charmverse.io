'use server';

import { authActionClient } from 'lib/actions/actionClient';

import { setupBuilderProfileSchema } from './config';
import { setupBuilderProfile } from './setupBuilderProfile';

export const setupBuilderProfileAction = authActionClient
  .metadata({ actionName: 'setup_builder_profile' })
  .schema(setupBuilderProfileSchema)
  .action(async ({ parsedInput }) => {
    const { code, state } = parsedInput;
    await setupBuilderProfile({ code, state });
  });
