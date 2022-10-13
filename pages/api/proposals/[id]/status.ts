
import type { ProposalStatus } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { hasAccessToSpace, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { updateProposalStatus } from 'lib/proposal/updateProposalStatus';
import { validateProposalStatusTransition } from 'lib/proposal/validateProposalStatusTransition';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['newStatus'], 'body'))
  .put(updateProposalStatusController);

async function updateProposalStatusController (req: NextApiRequest, res: NextApiResponse<ProposalWithUsers>) {
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
      category: true,
      page: true
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

  const updatedProposal = await updateProposalStatus({
    proposalId: proposal.id,
    newStatus,
    userId
  });

  trackUserAction('new_proposal_stage', { userId, pageId: proposal.page?.id || '', resourceId: proposalId, status: newStatus, spaceId: proposal.spaceId });

  return res.status(200).send(updatedProposal.proposal);
}

export default withSessionRoute(handler);
