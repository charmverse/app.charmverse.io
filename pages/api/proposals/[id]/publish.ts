import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { issueProposalCredentialsIfNecessary } from 'lib/credentials/issueProposalCredentialsIfNecessary';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { publishProposal } from 'lib/proposal/publishProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(publishProposalStatusController);

async function publishProposalStatusController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.move) {
    throw new ActionNotPermittedError(`You do not have permission to publish this proposal`);
  }

  const proposalPage = await prisma.page.findUnique({
    where: {
      proposalId
    },
    select: {
      id: true,
      proposal: {
        select: {
          archived: true,
          evaluations: {
            select: {
              id: true
            },
            orderBy: {
              index: 'asc'
            }
          }
        }
      },
      spaceId: true
    }
  });

  const isProposalArchived = proposalPage?.proposal?.archived || false;
  if (isProposalArchived) {
    throw new ActionNotPermittedError(`You cannot publish an archived proposal`);
  }

  const currentEvaluationId = proposalPage?.proposal?.evaluations[0]?.id || null;

  await publishProposal({
    proposalId,
    userId
  });

  if (proposalPage && currentEvaluationId) {
    await publishProposalEvent({
      proposalId,
      spaceId: proposalPage.spaceId,
      userId,
      currentEvaluationId
    });
  }

  await issueProposalCredentialsIfNecessary({
    event: 'proposal_created',
    proposalId
  });

  trackUserAction('new_proposal_stage', {
    userId,
    pageId: proposalPage?.id || '',
    resourceId: proposalId,
    status: 'published',
    spaceId: proposalPage?.spaceId || ''
  });

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
