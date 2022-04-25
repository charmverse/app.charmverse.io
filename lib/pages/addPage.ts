import { Page, Prisma } from '@prisma/client';
import { mutate } from 'swr';
import charmClient from 'charmClient';
import { NextRouter } from 'next/router';
import { addBoardClicked } from 'components/common/BoardEditor/focalboard/src/components/sidebar/sidebarAddBoardMenu';

export type NewPageInput = Partial<Page> & { spaceId: string, createdBy: string };

export async function addPage (page: NewPageInput): Promise<Page> {
  const spaceId = page.spaceId;
  const id = Math.random().toString().replace('0.', '');
  const pageProperties: Prisma.PageCreateInput = {
    content: undefined as any,
    contentText: '',
    createdAt: new Date(),
    author: {
      connect: {
        id: page.createdBy
      }
    },
    updatedAt: new Date(),
    updatedBy: page.createdBy,
    path: `page-${id}`,
    space: {
      connect: {
        id: spaceId
      }
    },
    title: '',
    type: 'page',
    ...(page ?? {})
  };
  if (pageProperties.type === 'board') {
    await addBoardClicked(boardId => {
      pageProperties.boardId = boardId;
      pageProperties.id = boardId; // use the same uuid value
    });
  }
  const newPage = await charmClient.createPage(pageProperties);
  mutate(`pages/${page.spaceId}`);
  return newPage;
}

export async function addPageAndRedirect (page: NewPageInput, router: NextRouter) {
  if (page) {
    const newPage = await addPage(page);
    router.push(`/${router.query.domain}/${newPage.path}`);
  }
}

