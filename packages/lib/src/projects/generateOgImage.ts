import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { checkDuration } from '../utils/performance';

import { saveOgImage } from './saveOgImage';

export async function generateOgImage(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, farcasterFrameImage: true }
  });

  if (!project) {
    throw new InvalidInputError(`Could not find project with id ${projectId}`);
  }

  if (project.farcasterFrameImage) {
    return project.farcasterFrameImage;
  }

  // Log duration of the image generation
  const url = await checkDuration(saveOgImage, { args: [projectId, userId], logMessage: 'Generated og:image' });

  await prisma.project.update({
    where: { id: projectId },
    data: { farcasterFrameImage: url }
  });

  log.info(`Generated OG Image for project ${projectId}`);

  return url;
}
