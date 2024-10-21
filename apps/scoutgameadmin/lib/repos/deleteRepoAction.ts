'use server';

import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

import { deleteRepo } from './deleteRepo';

export const deleteRepoAction = authActionClient
  .metadata({ actionName: 'delete_repo' })
  .schema(
    yup.object({
      repoId: yup.number().required(),
      deleteIt: yup.boolean().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const { repoId, deleteIt } = parsedInput;
    const result = await deleteRepo({ repoId, deleteIt });
    return result;
  });
