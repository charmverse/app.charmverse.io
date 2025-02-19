'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/connect-shared/lib/actions/actionClient';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@packages/connect-shared/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@packages/connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { trackMixpanelEvent } from '@packages/connect-shared/lib/mixpanel/trackMixpanelEvent';
import { isTestEnv } from '@root/config/constants';
import { charmverseProjectDataChainId, disableCredentialAutopublish } from '@root/lib/credentials/constants';
import { storeCharmverseProjectMetadata } from '@root/lib/credentials/reputation/storeCharmverseProjectMetadata';
import { generateOgImage } from '@root/lib/projects/generateOgImage';

import { sendProjectConfirmationEmail } from 'lib/mailer/sendProjectConfirmationEmail';

import { createProject } from './createProject';
import { schema } from './schema';

export const createProjectAction = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;

    const currentUserId = ctx.session.user.id;

    const totalProjects = await prisma.project.count({
      where: {
        source: 'sunny_awards'
      }
    });

    const newProject = await createProject({
      userId: currentUserId,
      input: {
        ...input,
        sunnyAwardsNumber: totalProjects + 1
      },
      source: 'sunny_awards'
    });

    if (!disableCredentialAutopublish) {
      await storeProjectMetadataAndPublishOptimismAttestation({
        projectId: newProject.id,
        userId: currentUserId,
        existingProjectRefUID: input.projectRefUIDToImport
      }).catch((error) => {
        log.error('Failed to store project metadata and publish optimism attestation', {
          error,
          userId: currentUserId
        });
      });
      await storeProjectMetadataAndPublishGitcoinAttestation({
        projectId: newProject.id,
        userId: ctx.session.user.id
      }).catch((error) => {
        log.error('Failed to store project metadata and publish Gitcoin attestation', {
          error,
          projectId: newProject.id,
          userId: currentUserId
        });
      });
      await storeCharmverseProjectMetadata({
        chainId: charmverseProjectDataChainId,
        projectId: newProject.id
      }).catch((error) => {
        log.error('Failed to store charmverse project attestations', {
          error,
          projectId: newProject.id,
          userId: newProject.createdBy
        });
      });
    }

    if (!isTestEnv) {
      try {
        await generateOgImage(newProject.id, currentUserId);
        trackMixpanelEvent('create_project', { projectId: newProject.id, userId: currentUserId });
        await sendProjectConfirmationEmail({
          projectId: newProject.id,
          userId: currentUserId
        });
      } catch (error) {
        log.error('Failed trying to send confirmation email', {
          error,
          projectId: newProject.id,
          userId: currentUserId
        });
      }
    }

    return { success: true, projectId: newProject.id, projectPath: newProject.path };
  });
