
import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { updateProposalStatus } from 'lib/proposal/updateProposalStatus';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['newStatus'], 'body'))
  .put(updateProposalStatusController);

async function updateProposalStatusController (req: NextApiRequest, res: NextApiResponse<{newStatus: ProposalStatus}>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

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

  const isCurrentUserProposalAuthor = proposal.authors.some(author => author.userId === userId);

  if (!isCurrentUserProposalAuthor) {
    throw new UnauthorisedActionError();
  }

  await updateProposalStatus({
    currentStatus: proposal.status,
    newStatus: req.body.newStatus,
    proposalId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
