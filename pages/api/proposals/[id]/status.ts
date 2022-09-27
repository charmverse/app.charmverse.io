
import type { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { hasAccessToSpace, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { updateProposalStatus } from 'lib/proposal/updateProposalStatus';
import { validateProposalStatusTransition } from 'lib/proposal/validateProposalStatusTransition';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['newStatus'], 'body'))
  .put(updateProposalStatusController);

async function updateProposalStatusController (req: NextApiRequest, res: NextApiResponse<{newStatus: ProposalStatus}>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;
  const newStatus = req.body.newStatus as ProposalStatus;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      authors: true,
      reviewers: true,
      category: true
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }

  const isUserAuthorizedToUpdateProposalStatus = await validateProposalStatusTransition({
    proposal,
    newStatus,
    userId
  });

  if (!isUserAuthorizedToUpdateProposalStatus && (await hasAccessToSpace({ spaceId: proposal.spaceId, userId, adminOnly: true })).error) {
    throw new UnauthorisedActionError();
  }

  await updateProposalStatus({
    proposal,
    newStatus,
    userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
