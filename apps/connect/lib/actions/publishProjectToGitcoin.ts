'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect/lib/actions/actionClient';
import * as yup from 'yup';

import { delay } from 'lib/utils/async';

const schema = yup.object({
  projectId: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;

export const actionPublishProjectToGitcoin = authActionClient
  .metadata({ actionName: 'publishProjectToGitcoin' })
  .schema(schema)
  .action(async ({ ctx, parsedInput }) => {
    await delay(3000);

    const project = await prisma.project.findUniqueOrThrow({
      where: {
        id: parsedInput.projectId
      }
    });

    return project;
  });
