'use server';

import { WrongStateError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect/lib/actions/actionClient';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@connect/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';
import * as yup from 'yup';

const schema = yup.object({
  projectId: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;

export const actionPublishProjectToGitcoin = authActionClient
  .metadata({ actionName: 'publishProjectToGitcoin' })
  .schema(schema)
  .action(async ({ ctx, parsedInput: { projectId } }) => {
    const existingAttestation = await prisma.gitcoinProjectAttestation.findFirst({
      where: {
        projectId
      },
      select: {
        id: true
      }
    });

    if (existingAttestation) {
      throw new WrongStateError('Project already published to Gitcoin');
    }

    await storeProjectMetadataAndPublishOptimismAttestation({ projectId, userId: ctx.session.user.id });

    return { success: true };
  });
