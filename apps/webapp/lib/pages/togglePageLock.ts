import type { Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';

import { lockablePageTypes } from './constants';

export type PageLockToggle = {
  pageId: string;
  isLocked: boolean;
};

export type PageLockToggleResult = Pick<Page, 'id' | 'lockedBy' | 'isLocked' | 'spaceId' | 'boardId' | 'type'>;

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

  const updatedPage = await prisma.page.update({
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
      type: true
    }
  });

  return updatedPage;
}
