
import { Application, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getApplication } from 'lib/applications/getApplication';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateApplication);

async function updateApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id } = req.query;

  if (id === undefined) {
    return res.status(400).send({ error: 'Please provide a valid application ID' } as any);
  }

  const body = req.body as Partial<Application>;

  const applicationWithBounty = await getApplication(id as string);

  if (!applicationWithBounty) {
    throw new DataNotFoundError(`Application with ID ${id} not found`);
  }

  const bounty = applicationWithBounty.bounty;

  if (bounty.approveSubmitters === true && applicationWithBounty.status === 'applied') {
    throw new UnauthorisedActionError('Your application must have been accepted in order to make a submission');
  }

  const pageContent = typeof body.submissionNodes === 'string' ? body.submissionNodes
    : typeof body.submissionNodes === 'object' ? JSON.stringify(body.submissionNodes) : undefined;

  // Prevent accidental nulling of these fields
  const updateContent: Prisma.ApplicationUpdateInput = {
    message: body.message ?? undefined,
    walletAddress: body.walletAddress ?? undefined,
    submission: body.submission ?? undefined,
    submissionNodes: pageContent,
    // Auto progress an in progress application to review
    status: applicationWithBounty.status === 'inProgress' ? 'review' : undefined
  };

  let updatedApplication = await prisma.application.update({
    where: {
      id: id as string
    },
    data: updateContent
  });

  if (updatedApplication.status === 'inProgress') {
    updatedApplication = await prisma.application.update({
      where: {
        id: id as string
      },
      data: {
        status: 'review'
      }
    });
  }

  return res.status(200).json(updatedApplication);
}

export default withSessionRoute(handler);
