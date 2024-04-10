import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prismaToBlock } from 'lib/databases/block';
import type { Board } from 'lib/databases/board';
import { updateBoardProperties } from 'lib/databases/proposalsSource/updateBoardProperties';
import { updateCardPages } from 'lib/databases/proposalsSource/updateCardPages';
import { updateViews } from 'lib/databases/proposalsSource/updateViews';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['id'], 'query'))
  .post(createProposalSource)
  .put(updateProposalSource);

async function createProposalSource(req: NextApiRequest, res: NextApiResponse<PageMeta[]>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const boardPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      boardId: true,
      spaceId: true
    }
  });

  if (!boardPage?.boardId) {
    throw new NotFoundError('The board page does not exist');
  }

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  const boardBlock = await updateBoardProperties({ boardId: pageId });
  const board = prismaToBlock(boardBlock) as Board;
  const views = await updateViews({ board });

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: [board, ...views.map(prismaToBlock)]
    },
    board.spaceId
  );

  return res.status(200).end();
}

async function updateProposalSource(req: NextApiRequest, res: NextApiResponse<PageMeta[]>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const boardPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      boardId: true,
      spaceId: true
    }
  });

  if (!boardPage?.boardId) {
    throw new NotFoundError('The board page does not exist');
  }

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  log.debug('Refresh cards for proposal-as-a-source board (started)', { pageId, spaceId: boardPage.spaceId, userId });

  const result = await updateCardPages({ boardId: pageId, spaceId: boardPage.spaceId });

  log.debug('Refresh pages for proposal-as-a-source board (complete)', {
    pageId,
    spaceId: boardPage.spaceId,
    userId,
    result
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
