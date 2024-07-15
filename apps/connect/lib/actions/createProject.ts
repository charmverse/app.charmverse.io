'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect/lib/actions/actionClient';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { disableCredentialAutopublish } from '@root/lib/credentials/constants';

import { createConnectProject } from '../projects/createConnectProject';
import { schema } from '../projects/form';

export const actionCreateProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;
    const currentUserId = ctx.session.user!.id;
    const newProject = await createConnectProject({
      userId: currentUserId,
      input
    });

    if (!disableCredentialAutopublish) {
      await storeProjectMetadataAndPublishOptimismAttestation({
        projectId: newProject.id,
        userId: currentUserId
      }).catch((err) => {
        log.error('Failed to store project metadata and publish optimism attestation', { err, userId: currentUserId });
      });
    }

    await generateOgImage(newProject.id, currentUserId);

    return { success: true, projectId: newProject.id, projectPath: newProject.path };
  });
