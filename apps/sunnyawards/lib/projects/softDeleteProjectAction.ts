'use server';

import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import * as yup from 'yup';

import { softDeleteAndRevokeSunnyAwardsProject } from './softDeleteAndRevokeSunnyAwardsProject';

export const softDeleteProjectAction = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(
    yup.object({
      projectId: yup.string().required()
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;

    await softDeleteAndRevokeSunnyAwardsProject({
      projectId: input.projectId
    });
  });
