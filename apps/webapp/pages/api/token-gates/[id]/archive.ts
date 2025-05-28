import { prisma } from '@charmverse/core/prisma-client';
import { defaultHandler } from '@packages/lib/middleware/handler';
import { isSpaceAdmin } from '@packages/lib/permissions/isSpaceAdmin';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ApiError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = defaultHandler();

handler.put(archiveWorkflowController);

async function archiveWorkflowController(req: NextApiRequest, res: NextApiResponse) {
  const tokenGateId = req.query.id as string;
  const tokenGate = await prisma.tokenGate.findUniqueOrThrow({
    where: {
      id: tokenGateId
    },
    select: {
      spaceId: true
    }
  });

  const spaceAdmin = await isSpaceAdmin({ spaceId: tokenGate.spaceId, userId: req.session.user.id });

  if (!spaceAdmin) {
    throw new ApiError({
      message: 'You are not authorized to archive this token gate',
      errorType: 'Access denied'
    });
  }

  await prisma.tokenGate.update({
    where: {
      id: tokenGateId
    },
    data: {
      archived: true
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
