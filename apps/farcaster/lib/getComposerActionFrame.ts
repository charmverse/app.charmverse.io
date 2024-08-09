import { prisma } from '@charmverse/core/prisma-client';

export async function getComposerActionFrame(id: string) {
  const composerActionFrame = await prisma.composerActionFrame.findUniqueOrThrow({
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

  const [previousComposerActionFrame, nextComposerActionFrame] = await prisma.$transaction([
    prisma.composerActionFrame.findFirst({
      where: {
        createdAt: {
          lt: composerActionFrame.createdAt
        }
      },
      select: {
        id: true
      }
    }),
    prisma.composerActionFrame.findFirst({
      where: {
        createdAt: {
          gt: composerActionFrame.createdAt
        }
      },
      select: {
        id: true
      }
    })
  ]);

  return {
    ...composerActionFrame,
    previousComposerActionFrameId: nextComposerActionFrame?.id ?? null,
    nextComposerActionFrameId: previousComposerActionFrame?.id ?? null
  };
}
