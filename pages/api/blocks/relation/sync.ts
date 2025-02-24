import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prismaToBlock } from 'lib/databases/block';
import type { SyncRelationPropertyPayload } from 'lib/databases/relationProperty/syncRelationProperty';
import { syncRelationProperty } from 'lib/databases/relationProperty/syncRelationProperty';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(syncRelationPropertyHandler);

async function syncRelationPropertyHandler(req: NextApiRequest, res: NextApiResponse) {
  const payload = req.body as SyncRelationPropertyPayload;

  const sourceBoard = await prisma.block.findUniqueOrThrow({
    where: {
      id: payload.boardId
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

  const updatedBlocks = await syncRelationProperty({
    ...payload,
    userId: req.session.user.id
  });

  if (updatedBlocks.length) {
    relay.broadcast(
      {
        type: 'blocks_updated',
        payload: updatedBlocks.map((block) => prismaToBlock(block))
      },
      updatedBlocks[0].spaceId
    );
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
