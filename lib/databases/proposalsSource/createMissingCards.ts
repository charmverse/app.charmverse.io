import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { applyPageToBlock } from 'lib/databases/block';
import { createCardPage } from 'lib/pages/createCardPage';

import type { BlockWithDetails } from '../block';

// Create card blocks for proposals that do not exist already
export async function createMissingCards({ boardId }: { boardId: string }): Promise<BlockWithDetails[]> {
  const latestCard = await prisma.block.findFirst({
    where: { parentId: boardId, type: 'card' },
    select: { createdAt: true },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const latestTimestamp = latestCard?.createdAt;

  const rootPagePermissions = await prisma.page.findFirstOrThrow({
    where: {
      id: boardId
    },
    select: {
      createdBy: true,
      permissions: true,
      spaceId: true
    }
  });

  const pagesMissingCards = await prisma.page.findMany({
    where: {
      // create blocks for missing proposals
      createdAt: latestTimestamp
        ? {
            gt: latestTimestamp
          }
        : undefined,
      spaceId: rootPagePermissions.spaceId,
      type: 'proposal',
      proposal: {
        archived: {
          not: true
        },
        status: {
          not: 'draft'
        }
      },
      deletedAt: null
    },
    select: {
      id: true,
      path: true,
      title: true,
      content: true,
      contentText: true,
      hasContent: true,
      createdAt: true,
      spaceId: true
    }
  });

  if (pagesMissingCards.length > 0) {
    log.debug('Creating cards for Proposals source', {
      pageId: boardId,
      pagesMissingCards: pagesMissingCards.length,
      spaceId: rootPagePermissions.spaceId
    });
  }

  return Promise.all(
    pagesMissingCards.map(async (proposalPage) => {
      const createdAt = proposalPage.createdAt;

      const { block, page } = await createCardPage({
        title: proposalPage.title,
        boardId,
        spaceId: proposalPage.spaceId,
        createdAt,
        createdBy: rootPagePermissions.createdBy,
        properties: {},
        hasContent: proposalPage.hasContent,
        content: proposalPage.content,
        contentText: proposalPage.contentText,
        syncWithPageId: proposalPage.id,
        permissions: rootPagePermissions.permissions.map((permission) => ({
          permissionLevel: permission.permissionLevel,
          allowDiscovery: permission.allowDiscovery,
          inheritedFromPermission: permission.id,
          public: permission.public,
          roleId: permission.roleId,
          spaceId: permission.spaceId,
          userId: permission.userId
        }))
      });

      return applyPageToBlock(block, page);
    })
  );
}
