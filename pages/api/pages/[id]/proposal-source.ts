import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/interfaces';
import { prismaToBlock } from 'lib/databases/block';
import type { Board } from 'lib/databases/board';
import { updateBoardProperties } from 'lib/databases/proposalsSource/updateBoardProperties';
import { updateViews } from 'lib/databases/proposalsSource/updateViews';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

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
