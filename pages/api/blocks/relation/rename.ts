import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { RenameRelationPropertyPayload } from 'lib/focalboard/relationProperty/renameRelationProperty';
import { renameRelationProperty } from 'lib/focalboard/relationProperty/renameRelationProperty';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

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

  await renameRelationProperty({
    boardId,
    relatedPropertyTitle,
    templateId,
    userId
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
