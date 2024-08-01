'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { createOptimismProject } from '@connect-shared/lib/projects/createOptimismProject';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { charmverseProjectDataChainId, disableCredentialAutopublish } from '@root/lib/credentials/constants';
import { storeCharmverseProjectMetadata } from '@root/lib/credentials/reputation/storeCharmverseProjectMetadata';

import { schema } from './form';

export const createProjectAction = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;

    const currentUserId = ctx.session.user.id;
    const newProject = await createOptimismProject({
      userId: currentUserId,
      input: {
        ...input,
        primaryContractChainId: input.primaryContractChainId ? parseInt(input.primaryContractChainId) : undefined
      },
      source: 'connect'
    });

    if (!disableCredentialAutopublish) {
      await storeProjectMetadataAndPublishOptimismAttestation({
        projectId: newProject.id,
        userId: currentUserId
      }).catch((err) => {
        log.error('Failed to store project metadata and publish optimism attestation', { err, userId: currentUserId });
      });

      await storeProjectMetadataAndPublishGitcoinAttestation({
        projectIdOrPath: newProject.id,
        userId: currentUserId
      }).catch((err) => {
        log.error('Failed to store project metadata and publish gitcoin attestation', { err, userId: currentUserId });
      });

      await storeCharmverseProjectMetadata({
        chainId: charmverseProjectDataChainId,
        projectId: newProject.id
      }).catch((err) => {
        log.error('Failed to store charmverse project metadata', {
          err,
          projectId: newProject.id,
          userId: newProject.createdBy
        });
      });
    }

    await generateOgImage(newProject.id, currentUserId);

    return { success: true, projectId: newProject.id, projectPath: newProject.path };
  });
