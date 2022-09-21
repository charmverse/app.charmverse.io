
import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteProposalTemplateController);

async function deleteProposalTemplateController (req: NextApiRequest, res: NextApiResponse) {

  const userId = req.session.user.id;

  const proposalId = req.query.id;

  if (!proposalId) {
    throw new InvalidInputError('No proposalId provided');
  }

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId as string
    }
  });

  if (!proposal) {
    throw new DataNotFoundError(`No proposal found with id ${proposalId}`);
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
      id: proposalId as string
    }
  });

  res.status(200).send({ success: true });

}

export default withSessionRoute(handler);
