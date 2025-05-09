import { OverallBlocksCount, countSpaceBlocks } from 'lib/spaces/countSpaceBlocks/countAllSpaceBlocks';
import { prisma } from '@charmverse/core/prisma-client';
import { writeToSameFolder } from 'lib/utils/file';
import type { Space } from '@charmverse/core/prisma';
import { countBlocks } from '@packages/bangleeditor/countBlocks';

function getTotal(counts: Record<string, number>): number {
  return Object.entries(counts).reduce((count, [blockType, value]) => {
    return count + value;
  }, 0);
}

async function countSpaceBlocksOldVersion({ spaceId }: { spaceId: string }) {
  const [
    boardBlocks,
    views,
    blockComments,
    allPages,
    posts,
    postComments,
    inlineComments,
    pageComments,
    memberProperties,
    forumCategories
  ] = await Promise.all([
    prisma.block.findMany({
      where: {
        deletedAt: null,
        spaceId,
        type: 'board'
      },
      select: {
        id: true,
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
        id: true,
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
        id: true,
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
    prisma.comment.count({
      where: {
        page: {
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

  const documentBlocks = allPages
    .map((page) => countBlocks(page.content, { pageId: page.id, spaceId }))
    .reduce((a, b) => a + b, 0);

  const boardDescriptionBlocks = boardBlocks
    .map((board) => countBlocks((board.fields as any)?.description, { blockId: board.id, spaceId }))
    .reduce((a, b) => a + b, 0);

  const forumPostBlocks = posts
    .map((post) => countBlocks(post.content, { postId: post.id, spaceId }))
    .reduce((a, b) => a + b, 0);

  const comments = blockComments + inlineComments + pageComments + postComments;

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

/// END OLD CODE - The count space blocks above is an old version

let record: OverallBlocksCount = {
  total: 11,
  details: {
    comments: {
      total: 0,
      details: {
        applicationComment: 0,
        blockComment: 0,
        comment: 0,
        pageComments: 0,
        postComment: 0
      }
    },
    forum: {
      total: 0,
      details: {
        categories: 0,
        posts: 0,
        postContentBlocks: 0
      }
    },
    editorContent: 0,
    pages: {
      total: 0,
      details: {
        documents: 0,
        rewards: 0,
        proposals: 0,
        databases: 0,
        cards: 0
      }
    },
    databaseProperties: {
      total: 0,
      details: {
        databaseViews: 2,
        databaseDescriptions: 0,
        databaseProperties: 0,
        databaseRowPropValues: 0
      }
    },
    memberProperties: {
      total: 0,
      details: {
        memberProperties: 0,
        memberPropertyValues: 0
      }
    },
    proposals: {
      total: 0,
      details: {
        proposalViews: 0,
        proposalProperties: 0,
        proposalPropertyValues: 0,
        proposalRubricAnswers: 0,
        proposalFormFields: 0
      }
    }
  }
};

function camelToTitle(camelCase: string): string {
  return camelCase
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
}

function generateHeaders(record: OverallBlocksCount): string {
  const headers: string[] = ['Space', 'Old total', 'New Total'];
  for (const categoryKey in record.details) {
    const category = (record.details as any)[categoryKey];
    headers.push(`${camelToTitle(categoryKey)} (Total)`);
    if (category.details) {
      for (const detailKey in category.details) {
        headers.push(`${camelToTitle(categoryKey)} (${camelToTitle(detailKey)})`);
      }
    }
  }
  return headers.join(',') + '\n';
}

function generateRow(record: OverallBlocksCount, space: Pick<Space, 'domain'>, oldTotal: number): string {
  const dataRow: (string | number)[] = [space.domain, oldTotal, record.total];
  for (const categoryKey in record.details) {
    const category = (record.details as any)[categoryKey];
    if (categoryKey === 'editorContent') {
      dataRow.push(record.details.editorContent);
    } else if (category.details) {
      dataRow.push(category.total);
      for (const detailKey in category.details) {
        dataRow.push(category.details[detailKey]);
      }
    }
  }
  return dataRow.join(',') + '\n';
}

async function init(offset?: number, take?: number) {
  let csv = generateHeaders(record);

  const spaces = await prisma.space.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    skip: offset,
    take: take
  });

  const totalSpaces = spaces.length;

  for (let i = 0; i < totalSpaces; i++) {
    let space = spaces[i];
    const oldCount = await countSpaceBlocksOldVersion({ spaceId: space.id });
    const data = await countSpaceBlocks({ spaceId: space.id });
    csv += generateRow(data, space, oldCount.total);
    console.log('Processed space', i + 1 + (offset ?? 0), '/', totalSpaces + (offset ?? 0));
  }
  const fileName = `space-data-${new Date().toISOString()}.csv`;
  await writeToSameFolder({ data: csv, fileName });
}

init(7000, 500).then(() => {
  console.log('done');
});
