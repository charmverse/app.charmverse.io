import { getAccessiblePages, includePagePermissionsMeta } from 'lib/pages/server';
import { prisma } from 'db';

/**
 * Use this script to perform database searches.
 */

// const spaceId = "bc9e8464-4166-4f7c-8a14-bb293cc30d2a"
const spaceId = '6ad73203-39e4-41f2-ab02-570be300304e'

async function search() {
  const pages = await prisma.page.findMany({
    where: {
      spaceId
    }
  });
  const blocks = await prisma.block.findMany({
    where: {
      spaceId
    }
  });
  const boardPages = pages.filter(p => p.type === 'board' && !p.deletedAt);
  const noBoard = boardPages.filter(p => p.boardId && !blocks.find(b => b.id === p.boardId));
  const withBoard = boardPages.filter(p => p.boardId && blocks.find(b => b.id === p.boardId));
  const orphanBlocks = blocks.filter(b => noBoard.find(p => p.id === b.rootId || p.id === b.parentId));
  // @ts-ignore
  const orphanLinked = blocks.filter(b => noBoard.find(p => p.id === b.fields.linkedSourceId)).map(b => b.fields.linkedSourceId);
  console.log('linked orphan blocks', [...new Set(orphanLinked)].length)
  console.log('orphan blocks', orphanBlocks.length)
  console.log('have orphan blocks', [...new Set(orphanBlocks.map(b => b.parentId))].length)
  //console.log('orphan blocks', orphanBlocks.sort((a, b) => a.parentId > b.parentId ? -1 : 1).map(o => o.parentId + ': ' + o.type + ' ' + o.id))
  console.log({
    noBoard: noBoard.length,
    withBoard: withBoard.length,
  })
  // getAccessiblePages({
  //   meta: false,
  //   search: 'forum',
  //   spaceId: 'bc9e8464-4166-4f7c-8a14-bb293cc30d2a',
  //   userId: user.id
  // }).then((record) => {
  //   // eslint-disable-next-line no-console
  //   console.log(
  //     record.length,
  //     record.slice(0, 10).map((r) => r.title)
  //   );
  // });
}

search();
