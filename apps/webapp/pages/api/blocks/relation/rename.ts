import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prismaToBlock } from '@packages/databases/block';
import type { RenameRelationPropertyPayload } from '@packages/databases/relationProperty/renameRelationProperty';
import { renameRelationProperty } from '@packages/databases/relationProperty/renameRelationProperty';
import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['relatedPropertyTitle'], 'body')).put(renameRelationPropertyHandler);

async function renameRelationPropertyHandler(req: NextApiRequest, res: NextApiResponse) {
  const { relatedPropertyTitle, boardId, templateId } = req.body as RenameRelationPropertyPayload;
  const userId = req.session.user.id;

  const sourceBoard = await prisma.block.findUniqueOrThrow({
    where: {
      id: boardId
    },
    select: {
      spaceId: true
    }
  });

  const spaceId = sourceBoard.spaceId;

  const { error } = await hasAccessToSpace({ userId: req.session.user.id, spaceId });
  if (error) {
    throw new UnauthorisedActionError();
  }

  const updatedBlock = await renameRelationProperty({
    boardId,
    relatedPropertyTitle,
    templateId,
    userId
  });

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: [prismaToBlock(updatedBlock)]
    },
    updatedBlock.spaceId
  );

  res.status(200).end();
}

export default withSessionRoute(handler);
