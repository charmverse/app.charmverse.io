import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(appealEvaluationEndpoint);

async function appealEvaluationEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const evaluationId = req.query.id as string;
  const userId = req.session.user.id;

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

  const { error } = await hasAccessToSpace({
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

  if (!isAuthor) {
    throw new ActionNotPermittedError('Only authors can appeal evaluations');
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
      completedAt: null
    }
  });

  await publishProposalEvent({
    currentEvaluationId: evaluationId,
    appealed: true,
    proposalId: proposal.id,
    spaceId: proposal.spaceId,
    userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
