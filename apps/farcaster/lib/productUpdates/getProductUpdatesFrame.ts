import { prisma } from '@charmverse/core/prisma-client';

export async function getProductUpdatesFrame(id: string) {
  const productUpdatesFrame = await prisma.productUpdatesFarcasterFrame.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      text: true,
      image: true,
      createdAt: true,
      project: {
        select: {
          path: true
        }
      }
    }
  });

  const [previousFrame, nextFrame] = await prisma.$transaction([
    prisma.productUpdatesFarcasterFrame.findFirst({
      where: {
        createdAt: {
          lt: productUpdatesFrame.createdAt
        }
      },
      select: {
        id: true
      }
    }),
    prisma.productUpdatesFarcasterFrame.findFirst({
      where: {
        createdAt: {
          gt: productUpdatesFrame.createdAt
        }
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
