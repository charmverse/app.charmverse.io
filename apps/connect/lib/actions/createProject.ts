'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect/lib/actions/actionClient';

import { storeProjectMetadataAndPublishOptimismAttestation } from '../attestations/storeProjectMetadataAndPublishOptimismAttestation';
import { createConnectProject } from '../projects/createConnectProject';
import { schema } from '../projects/form';
import { generateOgImage } from '../projects/generateOgImage';

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

    await storeProjectMetadataAndPublishOptimismAttestation({
      projectId: newProject.id,
      userId: currentUserId
    }).catch((err) => {
      log.error('Failed to store project metadata and publish optimism attestation', { err, userId: currentUserId });
    });

    await generateOgImage(newProject.id, currentUserId);

    return { success: true, projectId: newProject.id, projectPath: newProject.path };
  });
