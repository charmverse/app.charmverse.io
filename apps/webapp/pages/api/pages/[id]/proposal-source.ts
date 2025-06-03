import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { prismaToBlock } from '@packages/databases/block';
import type { Board } from '@packages/databases/board';
import type { SelectedProposalProperties } from '@packages/databases/proposalsSource/interfaces';
import { updateBoardProperties } from '@packages/databases/proposalsSource/updateBoardProperties';
import { updateViews } from '@packages/databases/proposalsSource/updateViews';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError, NotFoundError } from '@packages/nextjs/errors';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['id'], 'query'))
  .post(createProposalSource);

async function createProposalSource(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;
  const { selectedProperties } = req.body as { selectedProperties: SelectedProposalProperties };

  const boardPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      boardId: true,
      spaceId: true,
      type: true
    }
  });

  if (!boardPage?.boardId) {
    throw new NotFoundError('The board page does not exist');
  }

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  const { isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: boardPage.spaceId
  });

  if (!isAdmin) {
    throw new ActionNotPermittedError('Only admins can use proposals as a source');
  }

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  const boardBlock = await updateBoardProperties({ boardId: pageId, selectedProperties });
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

export default withSessionRoute(handler);
