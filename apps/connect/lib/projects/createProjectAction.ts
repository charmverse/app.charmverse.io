'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';
import { createOptimismProject } from '@connect-shared/lib/projects/createOptimismProject';
import { schema } from '@connect-shared/lib/projects/form';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { disableCredentialAutopublish } from '@root/lib/credentials/constants';

export const actionCreateProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;
    const currentUserId = ctx.session.user!.id;
    const newProject = await createOptimismProject({
      userId: currentUserId,
      input,
      source: 'connect'
    });

    if (!disableCredentialAutopublish) {
      await storeProjectMetadataAndPublishOptimismAttestation({
        projectId: newProject.id,
        userId: currentUserId
      }).catch((err) => {
        log.error('Failed to store project metadata and publish optimism attestation', { err, userId: currentUserId });
      });
    } else {
      log.info('Skip credential publishing');
    }

    await generateOgImage(newProject.id, currentUserId);

    return { projectId: newProject.id, projectPath: newProject.path };
  });
