'use server';

import { DataNotFoundError, WrongStateError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect/lib/actions/actionClient';
import { storeProjectMetadataAndPublishToGitcoin } from '@connect/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { optimismSepolia } from 'viem/chains';
import * as yup from 'yup';

import { awsS3Bucket } from 'config/constants';
import { uploadFileToS3 } from 'lib/aws/uploadToS3Server';
import { attestOnchain } from 'lib/credentials/attestOnchain';
import { gitcoinProjectCredentialSchemaId } from 'lib/credentials/schemas/gitcoinProjectSchema';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';

import { mapProjectToGitcoin } from '../attestations/mapProjectToGitcoin';

import { fetchProject } from './fetchProject';

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

    await storeProjectMetadataAndPublishToGitcoin({ projectId, userId: ctx.session.user.id });

    return { success: true };
  });
