import { prisma } from '@charmverse/core/prisma-client';

import { createImage } from 'lib/productUpdates/createImageResponse';

export async function GET() {
  const update = await prisma.productUpdatesFarcasterFrame.findFirstOrThrow({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      project: true
    }
  });

  return createImage({
    avatar: update.project.avatar,
    project: update.project.name,
    userId: update.createdBy,
    createdAtLocal: new Date().toLocaleDateString(),
    text: update.text
  });
}
