'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { storeUpdatedProjectMetadataAttestation } from '@connect-shared/lib/attestations/storeUpdatedProjectMetadataAttestation';
import type { EditProjectValues } from '@connect-shared/lib/projects/editProject';
import { editProject } from '@connect-shared/lib/projects/editProject';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { charmverseProjectDataChainId, disableCredentialAutopublish } from '@root/lib/credentials/constants';
import { storeCharmverseProjectMetadata } from '@root/lib/credentials/reputation/storeCharmverseProjectMetadata';
import { revalidatePath } from 'next/cache';

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
        projectIdOrPath: editedProject.id,
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
