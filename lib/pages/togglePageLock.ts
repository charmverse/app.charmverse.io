import { InvalidInputError } from '@charmverse/core/errors';
import type { Block, Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { lockablePageTypes } from './constants';

export type PageLockToggle = {
  pageId: string;
  isLocked: boolean;
};

export type PageLockToggleResult = {
  page: Pick<Page, 'id' | 'lockedBy' | 'isLocked' | 'spaceId'>;
  block?: Pick<Block, 'id' | 'spaceId' | 'isLocked'>;
};

export async function togglePageLock({
  pageId,
  userId,
  isLocked
}: PageLockToggle & { userId: string }): Promise<PageLockToggleResult> {
  const { type: pageType } = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      type: true
    }
  });

  if (!lockablePageTypes.includes(pageType)) {
    throw new InvalidInputError(`Page type "${pageType}" cannot be locked`);
  }

  const updateResult: PageLockToggleResult = await prisma.$transaction(async (tx) => {
    const updatedPage = await tx.page.update({
      where: {
        id: pageId
      },
      data: {
        isLocked: !!isLocked,
        lockedBy: isLocked ? userId : null
      },
      select: {
        id: true,
        lockedBy: true,
        isLocked: true,
        spaceId: true,
        boardId: true,
        cardId: true
      }
    });

    let updatedBlock: Pick<Block, 'id' | 'isLocked' | 'spaceId'> | undefined;

    if (updatedPage.boardId || updatedPage.cardId) {
      updatedBlock = await tx.block.update({
        where: {
          id: updatedPage.cardId ?? (updatedPage.boardId as string)
        },
        data: {
          isLocked: !!isLocked
        },
        select: {
          id: true,
          isLocked: true,
          spaceId: true
        }
      });
    }

    return {
      page: updatedPage,
      block: updatedBlock
    };
  });

  return updateResult;
}
