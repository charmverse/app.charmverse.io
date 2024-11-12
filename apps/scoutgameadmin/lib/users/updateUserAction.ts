'use server';

import type { BuilderStatus } from '@charmverse/core/prisma';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

import { setBuilderStatus } from './updateUser';

export const setBuilderStatusAction = authActionClient
  .metadata({ actionName: 'set_builder_status' })
  .schema(
    yup.object({
      userId: yup.string().required(),
      status: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId, status } = parsedInput;
    const result = await setBuilderStatus(userId, status as BuilderStatus);
    return result;
  });
