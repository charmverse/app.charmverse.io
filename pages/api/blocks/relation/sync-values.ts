import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { SyncRelatedCardsValuesPayload } from 'lib/focalboard/relationProperty/syncRelatedCardsValues';
import { syncRelatedCardsValues } from 'lib/focalboard/relationProperty/syncRelatedCardsValues';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(syncRelatedCardsValuesHandler);

async function syncRelatedCardsValuesHandler(req: NextApiRequest, res: NextApiResponse) {
  const payload = req.body as SyncRelatedCardsValuesPayload;

  const card = await prisma.block.findFirstOrThrow({
    where: {
      id: payload.cardId
    },
    select: {
      spaceId: true
    }
  });

  const spaceId = card.spaceId;

  const { error } = await hasAccessToSpace({ userId: req.session.user.id, spaceId });
  if (error) {
    throw new UnauthorisedActionError();
  }

  await syncRelatedCardsValues({
    ...payload,
    userId: req.session.user.id
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
