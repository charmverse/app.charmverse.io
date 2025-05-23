import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }), requestZip);

async function requestZip(req: NextApiRequest, res: NextApiResponse) {
  const userEmail = await prisma.user.findUniqueOrThrow({
    where: {
      id: req.session.user?.id
    },
    select: {
      email: true
    }
  });
  const exportJob = await prisma.spaceExportJob.create({
    data: {
      spaceId: req.query.id as string,
      createdBy: req.session.user?.id,
      status: 'pending',
      emailToNotify: userEmail.email
    }
  });

  return res.status(200).send({ success: true });
}

export default withSessionRoute(handler);
