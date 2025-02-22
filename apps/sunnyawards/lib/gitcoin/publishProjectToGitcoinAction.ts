'use server';

import { WrongStateError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@packages/connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

const schema = yup.object({
  projectPath: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;

export const publishProjectToGitcoinAction = authActionClient
  .metadata({ actionName: 'publishProjectToGitcoin' })
  .schema(schema)
  .action(async ({ ctx, parsedInput: { projectPath } }) => {
    const existingAttestation = await prisma.gitcoinProjectAttestation.findFirst({
      where: {
        project: {
          path: projectPath
        }
      },
      select: {
        id: true,
        project: {
          select: {
            id: true
          }
        }
      }
    });

    if (existingAttestation) {
      throw new WrongStateError('Project already published to Gitcoin');
    }

    const project = await prisma.project.findFirstOrThrow({
      where: {
        path: projectPath
      }
    });

    await storeProjectMetadataAndPublishGitcoinAttestation({
      projectId: project.id,
      userId: ctx.session.user.id
    });

    return { success: true };
  });
