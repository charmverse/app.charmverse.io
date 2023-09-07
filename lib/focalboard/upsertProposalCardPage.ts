import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getPagePath } from 'lib/pages/utils';

type ProposalCardPageUpsert = Pick<Page, 'title' | 'spaceId' | 'hasContent' | 'content' | 'contentText'> & {
  fields: any;
  syncWithPageId: string;
  boardId: string;
  userId: string;
  // If fields is provided, properties will be ignored
} & Partial<Pick<Page, 'updatedAt' | 'deletedAt' | 'createdAt'>>;

export async function upsertProposalCardPage({
  boardId,
  syncWithPageId,
  content,
  contentText,
  createdAt,
  updatedAt,
  userId,
  hasContent,
  spaceId,
  title,
  deletedAt,
  fields
}: ProposalCardPageUpsert) {
  return prisma.$transaction(async (tx) => {
    const upsertedPage = await tx.page.upsert({
      // @ts-ignore
      where: {
        parentId_syncWithPageId: {
          parentId: boardId,
          syncWithPageId
        }
      },
      create: {
        path: getPagePath(),
        type: 'card',
        parentId: boardId,
        syncWithPageId,
        content: content as any,
        contentText,
        createdAt,
        updatedAt: createdAt,
        hasContent,
        title,
        author: { connect: { id: userId } },
        updatedBy: userId,
        space: { connect: { id: spaceId } }
      },
      update: {
        updatedAt,
        updatedBy: userId,
        deletedAt,
        title,
        hasContent,
        content: content as any,
        contentText
      }
    });

    const upsertedBlock = await tx.block.upsert({
      where: {
        id: upsertedPage.id
      },
      create: {
        id: upsertedPage.id,
        user: {
          connect: { id: userId }
        },
        space: {
          connect: { id: spaceId }
        },
        updatedBy: userId,
        parentId: boardId,
        rootId: boardId,
        schema: 1,
        type: 'card',
        title,
        fields,
        page: {
          connect: {
            id: upsertedPage.id
          }
        }
      },
      update: {
        title,
        updatedAt,
        fields
      }
    });

    return {
      page: upsertedPage,
      block: upsertedBlock
    };
  });
}
