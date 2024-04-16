import { prisma } from '@charmverse/core/dist/cjs/prisma-client';
import type { Page } from '@charmverse/core/prisma';

export type PageLockToggle = {
  pageId: string;
  isLocked: boolean;
};

export type PageLockToggleResult = Pick<Page, 'lockedBy' | 'isLocked'>;

export async function togglePageLock({
  pageId,
  userId,
  isLocked
}: PageLockToggle & { userId: string }): Promise<PageLockToggleResult> {
  const updatedPage = await prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      isLocked: !!isLocked,
      lockedBy: isLocked ? userId : null
    },
    select: {
      lockedBy: true,
      isLocked: true
    }
  });

  return updatedPage;
}
