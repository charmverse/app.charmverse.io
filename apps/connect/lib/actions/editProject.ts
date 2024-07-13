'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect/lib/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { disableCredentialAutopublish } from 'lib/credentials/constants';

import { storeUpdatedProjectMetadataAttestation } from '../attestations/storeUpdatedProjectMetadataAttestation';
import { editConnectProject } from '../projects/editConnectProject';
import type { FormValues } from '../projects/form';
import { schema } from '../projects/form';
import { generateOgImage } from '../projects/generateOgImage';

export const actionEditProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;
    const currentUserId = ctx.session.user!.id;
    const editedProject = await editConnectProject({
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
