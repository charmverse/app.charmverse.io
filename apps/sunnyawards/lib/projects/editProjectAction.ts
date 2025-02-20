'use server';

import { log } from '@charmverse/core/log';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@packages/connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { storeUpdatedProjectMetadataAttestation } from '@packages/connect-shared/lib/attestations/storeUpdatedProjectMetadataAttestation';
import { charmverseProjectDataChainId, disableCredentialAutopublish } from '@packages/credentials/constants';
import { storeCharmverseProjectMetadata } from '@packages/credentials/reputation/storeCharmverseProjectMetadata';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { generateOgImage } from '@root/lib/projects/generateOgImage';
import { revalidatePath } from 'next/cache';

import { editProject } from 'lib/projects/editProject';
import type { EditProjectValues } from 'lib/projects/editProject';

import { schema } from './schema';

export const editProjectAction = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;
    const currentUserId = ctx.session.user!.id;
    const editedProject = await editProject({
      userId: currentUserId,
      input: { ...input, projectId: input.id } as EditProjectValues
    });

    await generateOgImage(editedProject.id, currentUserId);

    if (!disableCredentialAutopublish) {
      await storeUpdatedProjectMetadataAttestation({
        projectId: editedProject.id,
        userId: currentUserId
      }).catch((error) => {
        log.error('Failed to store and publish updated project metadata attestation', { error, userId: currentUserId });
      });

      await storeCharmverseProjectMetadata({
        chainId: charmverseProjectDataChainId,
        projectId: editedProject.id
      }).catch((error) => {
        log.error('Failed to store charmverse project metadata', {
          error,
          projectId: editedProject.id,
          userId: editedProject.createdBy
        });
      });

      await storeProjectMetadataAndPublishGitcoinAttestation({
        projectId: editedProject.id,
        userId: editedProject.createdBy
      }).catch((error) => {
        log.error('Failed to store project metadata and publish Gitcoin attestation', {
          error,
          projectId: editedProject.id,
          userId: currentUserId
        });
      });
    }

    revalidatePath(`/p/${editedProject.path}`);

    return { success: true };
  });
