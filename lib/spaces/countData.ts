import { prisma } from '@charmverse/core';

import { countBlocks } from 'lib/prosemirror/countBlocks';

// a function that queries the database for the number of blocks, proposals, pages, and bounties in a space
export async function countData({ spaceId }: { spaceId: string }) {
  const [
    boardBlocks,
    views,
    blockComments,
    allPages,
    posts,
    postComments,
    pageComments,
    memberProperties,
    proposalCategories,
    forumCategories
  ] = await Promise.all([
    prisma.block.findMany({
      where: {
        deletedAt: null,
        spaceId,
        type: 'board'
      },
      select: {
        fields: true
      }
    }),
    prisma.block.count({
      where: {
        deletedAt: null,
        spaceId,
        type: 'view'
      }
    }),
    prisma.block.count({
      where: {
        deletedAt: null,
        spaceId,
        type: 'comment'
      }
    }),
    prisma.page.findMany({
      where: {
        deletedAt: null,
        spaceId
      },
      select: {
        type: true,
        content: true
      }
    }),
    prisma.post.findMany({
      where: {
        deletedAt: null,
        spaceId
      },
      select: {
        content: true
      }
    }),
    prisma.postComment.count({
      where: {
        deletedAt: null,
        post: {
          spaceId
        }
      }
    }),
    prisma.pageComment.count({
      where: {
        deletedAt: null,
        page: {
          spaceId
        }
      }
    }),
    prisma.memberProperty.count({
      where: {
        spaceId
      }
    }),
    prisma.proposalCategory.count({
      where: {
        spaceId
      }
    }),
    prisma.postCategory.count({
      where: {
        spaceId
      }
    })
  ]);

  // Organize pages by type
  const { boards, bounties, proposals, cards, pages } = allPages.reduce(
    (result, page) => {
      if (page.type.includes('bounty')) {
        result.bounties.push(page);
      } else if (page.type.includes('proposal')) {
        result.proposals.push(page);
      } else if (page.type.includes('board')) {
        result.boards.push(page);
      } else if (page.type.includes('card')) {
        result.cards.push(page);
      } else {
        result.pages.push(page);
      }
      return result;
    },
    { boards: [], bounties: [], cards: [], pages: [], proposals: [] } as {
      boards: (typeof allPages)[number][];
      bounties: (typeof allPages)[number][];
      cards: (typeof allPages)[number][];
      pages: (typeof allPages)[number][];
      proposals: (typeof allPages)[number][];
    }
  );

  const documentBlocks = allPages.map((page) => countBlocks(page.content, spaceId)).reduce((a, b) => a + b, 0);

  const boardDescriptionBlocks = boardBlocks
    .map((board) => countBlocks((board.fields as any)?.description, spaceId))
    .reduce((a, b) => a + b, 0);

  const forumPostBlocks = posts.map((post) => countBlocks(post.content, spaceId)).reduce((a, b) => a + b, 0);

  const comments = blockComments + pageComments + postComments;

  const counts = {
    boards: boards.length,
    boardDescriptionBlocks,
    bounties: bounties.length,
    cards: cards.length,
    comments,
    documentBlocks,
    forumCategories,
    forumPostBlocks,
    forumPosts: posts.length,
    memberProperties,
    proposalCategories,
    proposals: proposals.length,
    pages: pages.length,
    views
  };

  return {
    counts,
    spaceId,
    total: getTotal(counts)
  };
}

function getTotal(counts: Record<string, number>): number {
  return Object.entries(counts).reduce((count, [blockType, value]) => {
    return count + value;
  }, 0);
}
