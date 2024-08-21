'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import { storeProjectMetadataAndPublishOptimismAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishOptimismAttestation';
import { storeProjectMetadataAndPublishGitcoinAttestation } from '@connect-shared/lib/attestations/storeProjectMetadataAndPublishToGitcoin';
import { trackMixpanelEvent } from '@connect-shared/lib/mixpanel/trackMixpanelEvent';
import { createProject } from '@connect-shared/lib/projects/createProject';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { isTestEnv } from '@root/config/constants';
import { charmverseProjectDataChainId, disableCredentialAutopublish } from '@root/lib/credentials/constants';
import { storeCharmverseProjectMetadata } from '@root/lib/credentials/reputation/storeCharmverseProjectMetadata';

import { sendProjectConfirmationEmail } from 'lib/mailer/sendProjectConfirmationEmail';

import { getOptimismCategory, schema } from './schema';

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
        sunnyAwardsNumber: totalProjects + 1,
        optimismCategory: getOptimismCategory(input.sunnyAwardsCategory),
        primaryContractChainId: input.primaryContractChainId ? parseInt(input.primaryContractChainId) : undefined
      },
      source: 'sunny_awards'
    });

    if (!disableCredentialAutopublish) {
      // await storeProjectMetadataAndPublishOptimismAttestation({
      //   projectId: newProject.id,
      //   userId: currentUserId,
      //   existingProjectRefUID: input.projectRefUIDToImport
      // }).catch((err) => {
      //   log.error('Failed to store project metadata and publish optimism attestation', { err, userId: currentUserId });
      // });

      await storeProjectMetadataAndPublishGitcoinAttestation({
        projectIdOrPath: newProject.id,
        userId: ctx.session.user.id
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
      await generateOgImage(newProject.id, currentUserId);
      await trackMixpanelEvent('create_project', { projectId: newProject.id, userId: currentUserId });
      try {
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
