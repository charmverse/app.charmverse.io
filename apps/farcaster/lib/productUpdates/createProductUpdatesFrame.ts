import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadFileToS3 } from '@root/lib/aws/uploadToS3Server';
import { ImageResponse } from 'next/og';
import React from 'react';
import sharp from 'sharp';
import { v4 } from 'uuid';

import { ProductUpdatesText } from 'components/product-updates/components/ProductUpdatesText';

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

  const element = React.createElement(ProductUpdatesText, {
    text: input.text,
    createdAtLocal: input.createdAtLocal,
    projectName: project.name,
    projectAvatarImage: project.avatar
  });
  // Use a ratio of 1.9:1 for the image as recommended by farcaster
  const image = new ImageResponse(element, {
    width: 500,
    height: 500 / 1.9
  });

  const imageBlob = await image.blob();
  const imageData = await imageBlob.arrayBuffer().then((buffer) => Buffer.from(buffer));
  const optimizedBuffer = await sharp(imageData).webp({ quality: 100 }).toBuffer();
  const frameId = v4();

  const { fileUrl } = await uploadFileToS3({
    pathInS3: getUserS3FilePath({ userId: user.id, url: `frame-${frameId}` }),
    content: optimizedBuffer,
    contentType: 'image/webp'
  });

  const productUpdatesFrame = await prisma.productUpdatesFarcasterFrame.create({
    data: {
      id: frameId,
      projectId: input.projectId,
      text: input.text,
      image: fileUrl,
      createdAtLocal: input.createdAtLocal,
      createdBy: user.id
    }
  });

  return productUpdatesFrame;
}
