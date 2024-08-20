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
      author: {
        select: {
          farcasterUser: {
            select: {
              fid: true
            }
          }
        }
      },
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
      orderBy: {
        createdAt: 'desc'
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
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true
      }
    })
  ]);

  return {
    authorFid: productUpdatesFrame.author.farcasterUser?.fid,
    image: productUpdatesFrame.image,
    previousFrameId: previousFrame?.id ?? null,
    nextFrameId: nextFrame?.id ?? null
  };
}
