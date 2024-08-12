import { prisma } from '@charmverse/core/prisma-client';

export async function getProductUpdatesFrame(id: string) {
  const productUpdatesFrame = await prisma.productUpdatesFarcasterFrame.findUnique({
    where: {
      id
    },
    select: {
      text: true,
      image: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          path: true
        }
      }
    }
  });

  if (!productUpdatesFrame) {
    return null;
  }

  const [previousFrame, nextFrame] = await prisma.$transaction([
    prisma.productUpdatesFarcasterFrame.findFirst({
      where: {
        createdAt: {
          lt: productUpdatesFrame.createdAt
        },
        projectId: productUpdatesFrame.project.id
      },
      select: {
        id: true
      }
    }),
    prisma.productUpdatesFarcasterFrame.findFirst({
      where: {
        createdAt: {
          gt: productUpdatesFrame.createdAt
        },
        projectId: productUpdatesFrame.project.id
      },
      select: {
        id: true
      }
    })
  ]);

  return {
    image: productUpdatesFrame.image,
    previousFrameId: previousFrame?.id ?? null,
    nextFrameId: nextFrame?.id ?? null
  };
}
