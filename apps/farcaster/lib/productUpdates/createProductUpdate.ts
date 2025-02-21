import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadFileToS3 } from '@packages/aws/uploadToS3Server';
import sharp from 'sharp';
import { v4 } from 'uuid';

import { createImage } from './createImageResponse';
import type { FormValues } from './schema';

export type NewProductUpdateResponse = Awaited<ReturnType<typeof createProductUpdate>>;

export async function createProductUpdate(input: FormValues) {
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

  const image = await createImage({
    avatar: project.avatar,
    project: project.name,
    userId: user.id,
    text: input.content.text,
    createdAtLocal: input.createdAtLocal
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
