import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadFileToS3 } from '@root/lib/aws/uploadToS3Server';
import { ImageResponse } from 'next/og';
import React from 'react';
import sharp from 'sharp';
import { v4 } from 'uuid';

import { ProductUpdatesFrame } from 'components/product-updates/frames/[id]/ProductUpdatesFrame';

import type { FormValues } from './schema';

export async function createProductUpdatesFrame(input: FormValues) {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      farcasterUser: {
        fid: input.authorFid
      }
    },
    select: {
      id: true
    }
  });

  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: input.projectId
    },
    select: {
      name: true,
      avatar: true
    }
  });

  let projectAvatarImageUrl: string | null = project.avatar;

  // Convert project avatar image to PNG if it's not already
  if (project.avatar && !project.avatar.endsWith('.png')) {
    const projectAvatarBlob = await fetch(project.avatar).then((res) => res.blob());
    const projectAvatarData = await projectAvatarBlob.arrayBuffer().then((buffer) => Buffer.from(buffer));
    const projectAvatarOptimizedBuffer = await sharp(projectAvatarData).png().toBuffer();
    const filenameWithoutExtension = project.avatar.split('.').slice(0, -1).join('.');
    const { fileUrl: projectAvatarFileUrl } = await uploadFileToS3({
      pathInS3: getUserS3FilePath({
        userId: user.id,
        url: `project-${input.projectId}-${filenameWithoutExtension}.png`
      }),
      content: projectAvatarOptimizedBuffer,
      contentType: 'image/png'
    });

    projectAvatarImageUrl = projectAvatarFileUrl;
  }

  const element = React.createElement(ProductUpdatesFrame, {
    text: input.content.text,
    createdAtLocal: input.createdAtLocal,
    projectName: project.name,
    projectAvatarImage: projectAvatarImageUrl
  });

  // Use a ratio of 1.91:1 for the image as recommended by farcaster
  const image = new ImageResponse(element, {
    width: 500,
    height: 500
  });

  const imageBlob = await image.blob();
  const imageData = await imageBlob.arrayBuffer().then((buffer) => Buffer.from(buffer));
  const optimizedBuffer = await sharp(imageData).webp().toBuffer();
  const frameId = v4();

  const { fileUrl } = await uploadFileToS3({
    pathInS3: getUserS3FilePath({ userId: user.id, url: `frame-${frameId}` }),
    content: optimizedBuffer,
    contentType: 'image/webp'
  });
  log.debug('Image url for product update', { fileUrl });
  const productUpdatesFrame = await prisma.productUpdatesFarcasterFrame.create({
    data: {
      id: frameId,
      projectId: input.projectId,
      text: input.content.text,
      textContent: input.content.json,
      image: fileUrl,
      createdAtLocal: input.createdAtLocal,
      createdBy: user.id
    }
  });

  return {
    productUpdatesFrame,
    project: {
      name: project.name
    }
  };
}
