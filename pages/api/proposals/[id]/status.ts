import type { ProposalStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { updateProposalStatus } from 'lib/proposal/updateProposalStatus';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['newStatus'], 'body'))
  .put(updateProposalStatusController);

async function updateProposalStatusController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;
  const newStatus = req.body.newStatus as ProposalStatus;

  await updateProposalStatus({
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

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
