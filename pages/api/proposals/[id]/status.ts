import type { ProposalStatus } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { InvalidStateError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeProposalFlowFlags } from 'lib/proposal/computeProposalFlowFlags';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { updateProposalStatus } from 'lib/proposal/updateProposalStatus';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['newStatus'], 'body'))
  .put(updateProposalStatusController);

async function updateProposalStatusController(req: NextApiRequest, res: NextApiResponse<ProposalWithUsers>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;
  const newStatus = req.body.newStatus as ProposalStatus;

  const updatedProposal = await updateProposalStatus({
    proposalId,
    newStatus,
    userId
  });

  const proposalPage = await prisma.page.findUnique({
    where: {
      proposalId
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  trackUserAction('new_proposal_stage', {
    userId,
    pageId: proposalPage?.id || '',
    resourceId: proposalId,
    status: newStatus,
    spaceId: proposalPage?.spaceId || ''
  });

  return res.status(200).send(updatedProposal.proposal);
}

export default withSessionRoute(handler);
