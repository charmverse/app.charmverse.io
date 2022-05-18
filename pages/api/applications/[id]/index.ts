
import { Application, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateApplication);

async function updateApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id } = req.query;

  if (id === undefined) {
    return res.status(400).send({ error: 'Please provide a valid application ID' } as any);
  }

  const body = req.body as Partial<Application>;

  console.log('DATA');

  const pageContent = typeof body.submissionNodes === 'string' ? body.submissionNodes
    : typeof body.submissionNodes === 'object' ? JSON.stringify(body.submissionNodes) : undefined;

  // Prevent accidental nulling of these fields
  const updateContent: Prisma.ApplicationUpdateInput = {
    message: body.message ?? undefined,
    walletAddress: body.walletAddress ?? undefined,
    submission: body.submission ?? undefined,
    submissionNodes: pageContent
  };

  const updatedApplication = await prisma.application.update({
    where: {
      id: id as string
    },
    data: updateContent
  });
  return res.status(200).json(updatedApplication);
}

export default withSessionRoute(handler);
