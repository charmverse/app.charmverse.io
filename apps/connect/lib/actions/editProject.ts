'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect/lib/actions/actionClient';
import { storeUpdatedProjectMetadataAttestation } from '@connect-shared/lib/attestations/storeUpdatedProjectMetadataAttestation';
import { editOptimismProject } from '@connect-shared/lib/projects/editOptimismProject';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { revalidatePath } from 'next/cache';

import { disableCredentialAutopublish } from 'lib/credentials/constants';

import type { FormValues } from '../../../../@connect-shared/lib/projects/form';
import { schema } from '../../../../@connect-shared/lib/projects/form';

export const actionEditProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;
    const currentUserId = ctx.session.user!.id;
    const editedProject = await editOptimismProject({
      userId: currentUserId,
      input: input as FormValues & {
        projectId: string;
      }
    });

    await generateOgImage(editedProject.id, currentUserId);

    if (!disableCredentialAutopublish) {
      await storeUpdatedProjectMetadataAttestation({
        projectId: editedProject.id,
        userId: currentUserId
      }).catch((err) => {
        log.error('Failed to store and publish updated project metadata attestation', { err, userId: currentUserId });
      });
    }

    revalidatePath(`/p/${editedProject.path}`);

    return { success: true };
  });
