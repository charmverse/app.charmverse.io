import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { PageNotFoundError } from '@packages/core/errors';
import type { PageMetaWithPermissions } from '@packages/core/pages';

type GetPageInput = {
  pageId: string;
  tx?: Prisma.TransactionClient;
};

export async function getPageMetaWithPermissions({
  pageId,
  tx = prisma
}: GetPageInput): Promise<PageMetaWithPermissions> {
  const page = await tx.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      deletedAt: true,
      deletedBy: true,
      createdAt: true,
      createdBy: true,
      updatedAt: true,
      updatedBy: true,
      title: true,
      headerImage: true,
      icon: true,
      path: true,
      parentId: true,
      spaceId: true,
      type: true,
      boardId: true,
      index: true,
      cardId: true,
      proposalId: true,
      bountyId: true,
      hasContent: true,
      galleryImage: true,
      syncWithPageId: true,
      sourceTemplateId: true,
      lensPostLink: true,
      permissions: { include: { sourcePermission: true } }
    }
  });
  if (!page) {
    throw new PageNotFoundError(pageId);
  }
  return page;
}
