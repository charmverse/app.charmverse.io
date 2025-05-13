import { prisma } from '@charmverse/core/prisma-client';
import { Page } from '@charmverse/core/prisma';

async function init() {
  const inlineBoardPages = await prisma.page.findMany({
    where: {
      type: 'inline_board',
      boardId: {
        not: null
      }
    },
    select: {
      id: true,
      boardId: true,
      title: true
    }
  });
  console.log('found inline board pages', inlineBoardPages.length);
  console.log('found inline board pages with title', inlineBoardPages.filter((p: { title: string }) => p.title).length);

  let blockTitles = 0;
  for (const page of inlineBoardPages) {
    const boardBlock = await prisma.block.findFirst({
      where: {
        id: page.boardId as string
      }
    });
    if (boardBlock?.title) {
      blockTitles++;
      // console.log(boardBlock.title)
      await prisma.page.update({
        where: {
          id: page.id
        },
        data: {
          title: boardBlock.title
        }
      });
    }
  }
  console.log('found inline board pages with block title', blockTitles);
}

init();
