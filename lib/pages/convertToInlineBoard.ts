import { Board } from 'lib/focalboard/board';
import { Page } from '@prisma/client';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import charmClient from 'charmClient';
import { mutate } from 'swr';
import { createDefaultViewsAndCards } from './addPage';

export async function convertToInlineBoard ({ board }: { board: Board }) {
  const { view, cards } = createDefaultViewsAndCards({ board });
  await mutator.insertBlocks(
    [view, ...cards],
    'convert board'
  );
  const updatedPage = await charmClient.updatePage({ id: board.id, type: 'inline_board' });
  await mutate(`pages/${board.spaceId}`, (pages: Page[]) => {
    const withoutBoard = pages.filter(page => page.id !== updatedPage.id);
    return [...withoutBoard, updatedPage];
  }, {
    // revalidate pages for board since we create 3 default ones
    revalidate: true
  });
  return {
    view
  };
}
