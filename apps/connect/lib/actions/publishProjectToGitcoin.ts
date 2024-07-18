'use server';

import { WrongStateError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

const schema = yup.object({
  projectPath: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;

export const actionPublishProjectToGitcoin = authActionClient
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
        id: true
      }
    });

    if (existingAttestation) {
      throw new WrongStateError('Project already published to Gitcoin');
    }

    await storeProjectMetadataAndPublishGitcoinAttestation({
      projectIdOrPath: projectPath,
      userId: ctx.session.user.id
    });

    return { success: true };
  });
