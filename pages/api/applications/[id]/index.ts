
import type { Application } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { updateApplication } from 'lib/applications/actions/updateApplication';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<Application>(['message'], 'body'))
  .put(updateApplicationController);

async function updateApplicationController (req: NextApiRequest, res: NextApiResponse<Application>) {

  const { id } = req.query;

  const existingApplicationWithIdsOnly = await prisma.application.findFirst({
    where: {
      id: id as string
    },
    select: {
      createdBy: true
    }
  });

  if (!existingApplicationWithIdsOnly) {
    throw new DataNotFoundError(`Application with id ${id} was not found`);
  }

  if (existingApplicationWithIdsOnly.createdBy !== req.session.user.id) {
    throw new UnauthorisedActionError('You cannot edit another user\'s application');
  }

  const updatedApplication = await updateApplication({
    applicationId: id as string,
    message: req.body.message
  });

  return res.status(200).json(updatedApplication);
}

export default withSessionRoute(handler);
