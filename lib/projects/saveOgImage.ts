import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { ProjectShareItem } from '@packages/connect-shared/components/ProjectShareItem';
import { getUserS3FilePath, uploadFileToS3 } from '@root/lib/aws/uploadToS3Server';
import { ImageResponse } from 'next/og';
import React from 'react';
import sharp from 'sharp';

export async function saveOgImage(projectId: string, userId: string) {
  if (!projectId) {
    throw new DataNotFoundError('No id provided');
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      name: true,
      sunnyAwardsNumber: true
    }
  });

  if (!project) {
    throw new DataNotFoundError(`Could not find project with id ${projectId}`);
  }

  const element = React.createElement(ProjectShareItem, { project });

  // Generate Image Response
  const image = new ImageResponse(element, {
    width: 500,
    height: 260
  });

  // Blob to Array Buffer
  const imageBlob = await image.blob();
  const imageData = await imageBlob.arrayBuffer();

  const optimizedBuffer = await sharp(imageData).webp({ quality: 100 }).toBuffer();

  const { fileUrl } = await uploadFileToS3({
    pathInS3: getUserS3FilePath({ userId, url: `project-${projectId}` }),
    content: optimizedBuffer,
    contentType: 'image/webp'
  });

  return fileUrl;
}
