import type { Block as PrismaBlock } from '@prisma/client';

import { prisma } from 'db';
import { blockToPrisma, prismaToBlock } from 'lib/focalboard/block';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import log from 'lib/log';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { WrongStateError } from 'lib/utilities/errors/invalidData';
import { isTruthy } from 'lib/utilities/types';
import { relay } from 'lib/websockets/relay';

import { syncThrottlePeriod } from './config';
import { getCardsAndPages } from './getCardsAndPages';
import { getFormAndResponses } from './getFormAndResponses';

export async function syncFormResponses({
  createdBy,
  view,
  reset
}: {
  createdBy: string;
  view: PrismaBlock;
  reset?: boolean;
}) {
  const rootId = view.rootId;
  const viewId = view.id;
  const fields = view.fields as BoardViewFields;
  const sourceData = fields.sourceData;
  if (fields.sourceType !== 'google_form' || !sourceData) {
    throw new WrongStateError('Board is not set up to connect to Google');
  }
  // clear out the board if we're resetting
  if (reset && fields.sourceData?.boardId) {
    const cards = await prisma.block.findMany({ where: { parentId: fields.sourceData.boardId } });
    const pages = await prisma.page.findMany({ where: { id: { in: cards.map((c) => c.id) } } });
    await prisma.$transaction([
      prisma.block.deleteMany({ where: { id: fields.sourceData.boardId } }),
      prisma.page.deleteMany({ where: { id: { in: pages.map((p) => p.id) } } })
    ]);
    delete sourceData.boardId;
  }

  // First, set up the board or "database" block, including the cardProperties based on form questions
  const { board, hasRefreshedRecently, lastUpdated, responseCount } = await getHiddenDatabaseBlock(sourceData);
  const rootBoardPage = await prisma.page.findUniqueOrThrow({ where: { id: rootId }, include: { permissions: true } });
  board.createdBy = createdBy;
  board.spaceId = rootBoardPage.spaceId;
  board.parentId = rootId;
  board.rootId = rootId;
  board.updatedBy = createdBy;

  if (hasRefreshedRecently && !reset) {
    // log.debug('Skip refreshing board because it was refreshed recently', { syncThrottlePeriod });
    return;
  }

  // Retrieve the form and responses
  const { form, responses } = await getFormAndResponses(sourceData, reset ? null : lastUpdated);

  const { cardProperties, cards, pages } = getCardsAndPages({
    cardParentId: board.id,
    rootId,
    createdBy,
    form,
    responses,
    nextIndex: responseCount + 1,
    permissions: rootBoardPage.permissions,
    spaceId: rootBoardPage.spaceId
  });
  board.fields.cardProperties = cardProperties;

  const createOrUpdateBoard = prisma.block.upsert({
    where: {
      id: board.id
    },
    create: blockToPrisma(board),
    update: {
      fields: board.fields,
      updatedAt: new Date()
    }
  });

  // add the boardId to the view's sourceData
  sourceData.boardId = board.id;
  if (form.info?.documentTitle) {
    sourceData.formName = form.info.documentTitle;
  }
  fields.visiblePropertyIds = cardProperties.map((p) => p.id);

  const updateView = lastUpdated ? [] : [prisma.block.update({ where: { id: viewId }, data: { fields } })];

  const createCards = prisma.block.createMany({ data: cards });
  const createPages = pages.map((data) => prisma.page.create({ data }));

  // save to db
  await prisma.$transaction([createOrUpdateBoard, ...updateView, createCards, ...createPages]);

  const pageIds = pages.map((p) => p.id).filter(isTruthy);

  log.debug('Synced Google form responses', {
    boardId: board.id,
    formId: form.formId,
    responseCount: responses.length
  });

  await notifyUsers({
    spaceId: board.spaceId,
    view: prismaToBlock(view),
    pageIds,
    blocks: [board, ...cards.map((card) => prismaToBlock(card))]
  });

  // export for testing
  return { board, cards };
}

// retrieve or generate the board block which contains card properties
async function getHiddenDatabaseBlock({ boardId }: { boardId?: string } = {}) {
  const boardBlock = boardId ? await prisma.block.findUnique({ where: { id: boardId } }) : null;
  if (boardId && !boardBlock) {
    log.warn('Suspicious state: source boardId exists but board not found', { boardId });
  }

  const now = new Date();
  const defaultBoardValues: Partial<Block> = { createdAt: now.getTime() };
  const board = (boardBlock ?? createBoard({ block: defaultBoardValues })) as Block;
  const isNewBoard = now.getTime() === board.createdAt;
  const lastUpdated = isNewBoard ? null : now;
  const hasRefreshedRecently = !isNewBoard && now.getTime() - board.updatedAt < syncThrottlePeriod;
  const responseCount = await prisma.block.count({ where: { rootId: board.id } });

  return { board, hasRefreshedRecently, lastUpdated, responseCount };
}

async function notifyUsers({
  blocks,
  view,
  pageIds,
  spaceId
}: {
  spaceId: string;
  pageIds: string[];
  blocks: Block[];
  view: Block;
}) {
  relay.broadcast(
    {
      type: 'blocks_created',
      payload: blocks
    },
    spaceId
  );
  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: [view]
    },
    spaceId
  );
  const createdPages = await getPageMetaList(pageIds);
  relay.broadcast(
    {
      type: 'pages_created',
      payload: createdPages
    },
    spaceId
  );
}
