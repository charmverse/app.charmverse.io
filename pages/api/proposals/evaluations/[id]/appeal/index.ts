import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEventBase } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(appealEvaluationEndpoint);

async function appealEvaluationEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const evaluationId = req.query.id as string;
  const userId = req.session.user.id;
  const appealReason = req.body.appealReason as string;

  const proposalEvaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
    where: {
      id: evaluationId
    },
    select: {
      appealable: true,
      appealedAt: true,
      result: true,
      proposal: {
        select: {
          id: true,
          page: {
            select: {
              sourceTemplateId: true,
              type: true
            }
          },
          spaceId: true,
          authors: true
        }
      }
    }
  });

  const proposal = proposalEvaluation.proposal;

  const isAuthor = proposal.authors.some((author) => author.userId === userId);

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: proposalEvaluation.proposal.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  if (proposal.page?.type === 'proposal_template') {
    throw new ActionNotPermittedError();
  }

  if (!isAuthor && !isAdmin) {
    throw new ActionNotPermittedError('Only authors and admins can appeal evaluations');
  }

  if (proposalEvaluation.result !== 'fail') {
    throw new ActionNotPermittedError('Only failed evaluations can be appealed');
  }

  if (!proposalEvaluation.appealable) {
    throw new ActionNotPermittedError('This evaluation is not appealable');
  }

  if (proposalEvaluation.appealedAt) {
    throw new ActionNotPermittedError('This evaluation has already been appealed');
  }

  await prisma.proposalEvaluation.update({
    where: {
      id: evaluationId
    },
    data: {
      appealedAt: new Date(),
      result: null,
      appealedBy: userId,
      appealReason,
      completedAt: null
    }
  });

  await publishProposalEventBase({
    currentEvaluationId: evaluationId,
    proposalId: proposal.id,
    spaceId: proposal.spaceId,
    userId,
    scope: WebhookEventNames.ProposalAppealed
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
