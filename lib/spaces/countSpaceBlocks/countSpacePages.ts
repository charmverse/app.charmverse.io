import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import _sum from 'lodash/sum';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type DetailedPageCounts = {
  documents: number;
  rewards: number;
  proposals: number;
  databases: number;
  cards: number;
};

export type PageCounts = GenericBlocksCount<DetailedPageCounts>;

export async function countSpacePages({ spaceId }: BlocksCountQuery): Promise<PageCounts> {
  const pageCounts: PageCounts = {
    total: 0,
    details: {
      documents: 0,
      rewards: 0,
      proposals: 0,
      databases: 0,
      cards: 0
    }
  };

  const baseQuery: Prisma.PageWhereInput = {
    spaceId,
    deletedAt: null
  };

  pageCounts.details.documents = await prisma.page.count({
    where: {
      ...baseQuery,
      type: {
        in: ['page', 'page_template']
      }
    }
  });

  pageCounts.details.rewards = await prisma.page.count({
    where: {
      ...baseQuery,
      type: {
        in: ['bounty', 'bounty_template']
      }
    }
  });

  pageCounts.details.proposals = await prisma.page.count({
    where: {
      ...baseQuery,
      type: {
        in: ['proposal', 'proposal_template']
      }
    }
  });

  pageCounts.details.databases = await prisma.page.count({
    where: {
      ...baseQuery,
      type: {
        in: ['board', 'board_template', 'linked_board', 'inline_board', 'inline_linked_board']
      }
    }
  });

  pageCounts.details.cards = await prisma.page.count({
    where: {
      ...baseQuery,
      type: {
        in: ['card', 'card_template']
      }
    }
  });

  pageCounts.total = _sum(Object.values(pageCounts.details));

  return pageCounts;
}
