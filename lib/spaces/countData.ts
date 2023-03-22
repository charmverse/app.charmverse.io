import { prisma } from 'db';
import log from 'lib/log';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';

// a function that queries the database for the number of blocks, proposals, pages, and bounties in a space
export async function countData({ spaceId }: { spaceId: string }) {
  const [boards, views, blockComments, pages, posts, postComments, pageComments] = await Promise.all([
    prisma.block.count({
      where: {
        deletedAt: null,
        spaceId,
        type: 'board'
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
      }
    }),
    prisma.post.findMany({
      where: {
        deletedAt: null,
        spaceId
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
    })
  ]);

  // Should we count all status of bounty and proposal?
  // is a bounty/proposal category a "block"?
  const bounties = pages.filter((page) => page.type === 'bounty');
  const proposals = pages.filter((page) => page.type === 'proposal');
  const templates = pages.filter((page) => page.type.includes('template'));

  // should we count template doc blocks?
  const documentBlocks = pages
    .filter((page) => page.type === 'page' && page.content)
    .map((page) => countProsemirrorBlocks(page.content as any, page.spaceId))
    .reduce((a, b) => a + b, 0);

  const comments = blockComments + pageComments + postComments;

  const total = pages.length + boards + views + posts.length + comments + templates.length + documentBlocks;

  return {
    counts: {
      boards,
      bounties: bounties.length,
      documentBlocks,
      comments,
      proposals: proposals.length,
      pages: pages.length,
      posts: posts.length,
      views,
      templates: templates.length
    },
    spaceId,
    total
  };
}

function countProsemirrorBlocks(pageContent: any, spaceId?: string) {
  let count = 0;
  if (pageContent) {
    try {
      const doc = getNodeFromJson(pageContent);
      if (doc) {
        doc.nodesBetween(0, doc.nodeSize, (node) => {
          if (node.type) {
            count += 1;
          }
        });
      }
    } catch (error) {
      log.error('Error counting prosemirror blocks', { error, pageContent, spaceId });
    }
  }
  return count;
}
