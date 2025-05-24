import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }), requestZip)
  .get(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }), getExportJobStatus);

async function getExportJobStatus(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).send({ error: 'Job ID is required' });
  }
  const job = await prisma.spaceExportJob.findUnique({
    where: {
      id: jobId as string
    }
  });

  return res.status(200).send(job);
}

async function requestZip(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user!.id;
  const spaceId = req.query.id as string;

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
      spaceId,
      createdBy: req.session.user?.id,
      status: 'pending',
      emailToNotify: userEmail.email
    }
  });
  log.info('User requested data export', { userId, spaceId, jobId: exportJob.id });

  return res.status(200).send({ jobId: exportJob.id });
}

export default withSessionRoute(handler);
