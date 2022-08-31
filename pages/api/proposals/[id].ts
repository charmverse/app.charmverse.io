
import { prisma } from 'db';
import { NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { updateProposal } from 'lib/proposal/updateProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .put(updateProposalController);

async function updateProposalController (req: NextApiRequest, res: NextApiResponse) {

  const proposalId = req.query.id as string;

  const { authors, reviewers } = req.body;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      authors: true,
      reviewers: true
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }

  if (proposal.status !== 'draft' && proposal.status !== 'private_draft') {
    throw new UnauthorisedActionError();
  }

  await updateProposal({ proposal, authors, reviewers });

  res.status(200).end();

}

export default withSessionRoute(handler);
