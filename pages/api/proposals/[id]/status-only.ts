import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { updateProposalStatusOnly } from 'lib/proposal/updateProposalStatusOnly';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['newStatus'], 'body'))
  .put(updateProposalStatusController);

async function updateProposalStatusController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;
  const newStatus = req.body.newStatus as 'draft' | 'published';

  await updateProposalStatusOnly({
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
      proposal: {
        select: {
          evaluations: {
            select: {
              id: true
            }
          }
        }
      },
      spaceId: true
    }
  });

  const currentEvaluationId = proposalPage?.proposal?.evaluations[0]?.id || null;
  if (proposalPage && currentEvaluationId) {
    await publishProposalEvent({
      oldEvaluationId: null,
      proposalId,
      scope: WebhookEventNames.ProposalStatusChanged,
      spaceId: proposalPage.spaceId,
      userId,
      currentEvaluationId
    });
  }

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
