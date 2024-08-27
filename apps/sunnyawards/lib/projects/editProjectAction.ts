'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { storeUpdatedProjectMetadataAttestation } from '@connect-shared/lib/attestations/storeUpdatedProjectMetadataAttestation';
import { charmverseProjectDataChainId, disableCredentialAutopublish } from '@root/lib/credentials/constants';
import { storeCharmverseProjectMetadata } from '@root/lib/credentials/reputation/storeCharmverseProjectMetadata';
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
        projectIdOrPath: editedProject.id,
        userId: editedProject.createdBy
      });
    }

    revalidatePath(`/p/${editedProject.path}`);

    return { success: true };
  });
