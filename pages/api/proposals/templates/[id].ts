
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteProposalTemplateController);

async function deleteProposalTemplateController (req: NextApiRequest, res: NextApiResponse) {

  const userId = req.session.user.id;

  const templateId = req.query.id;

  if (!templateId) {
    throw new InvalidInputError('No proposalId provided');
  }

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: templateId as string
    }
  });

  if (!proposal) {
    throw new DataNotFoundError(`No proposal template found with id ${templateId}`);
  }

  const { spaceId } = proposal;

  const { error } = await hasAccessToSpace({
    spaceId,
    userId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  await prisma.proposal.delete({
    where: {
      id: templateId as string
    }
  });

  res.status(200).send({ success: true });

}

export default withSessionRoute(handler);
