import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { issueOffchainProposalCredentialsIfNecessary } from 'lib/credentials/issueOffchainProposalCredentialsIfNecessary';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ReviewEvaluationRequest } from 'lib/proposals/submitEvaluationResult';
import { submitEvaluationResult } from 'lib/proposals/submitEvaluationResult';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['evaluationId', 'result'], 'body')).put(updateEvaluationResultEndpoint);

// for submitting a review or removing a previous one
async function updateEvaluationResultEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { evaluationId, result } = req.body as ReviewEvaluationRequest;
  // A proposal can only be updated when its in draft or discussion status and only the proposal author can update it
  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  const evaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
    where: {
      id: evaluationId
    },
    include: {
      proposal: {
        select: {
          workflowId: true,
          archived: true,
          spaceId: true
        }
      }
    }
  });

  const workflow = await prisma.proposalWorkflow.findUniqueOrThrow({
    where: {
      id: evaluation.proposal.workflowId!
    },
    select: {
      evaluations: true
    }
  });

  const workflowEvaluation = (workflow.evaluations as WorkflowEvaluationJson[]).find(
    (e) => e.type === evaluation.type && e.title === evaluation.title
  );

  if (evaluation.proposal.archived) {
    throw new ActionNotPermittedError(`You cannot move an archived proposal to a different step.`);
  }

  if (!proposalPermissions.evaluate) {
    throw new ActionNotPermittedError(`You don't have permission to review this proposal.`);
  }

  if (!result) {
    throw new ActionNotPermittedError(`You must provide a result.`);
  }

  if (evaluation.result === result) {
    log.debug('Evaluation result is the same', { proposalId, evaluationId, result });
    return res.status(200).end();
  }

  const minReviews = workflowEvaluation?.minReviews ?? 1;
  const existingEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
    where: {
      evaluationId
    }
  });

  if (existingEvaluationReviews.length + 1 === minReviews) {
    const totalPassed =
      existingEvaluationReviews.filter((r) => r.result === 'pass').length + (result === 'pass' ? 1 : 0);
    const totalFailed =
      existingEvaluationReviews.filter((r) => r.result === 'fail').length + (result === 'fail' ? 1 : 0);
    const finalResult = totalPassed > totalFailed ? 'pass' : 'fail';
    await submitEvaluationResult({
      proposalId,
      evaluationId,
      result: finalResult,
      decidedBy: userId,
      spaceId: evaluation.proposal.spaceId
    });
    if (finalResult === 'pass') {
      await issueOffchainProposalCredentialsIfNecessary({
        event: 'proposal_approved',
        proposalId
      });
    }
  } else {
    await prisma.proposalEvaluationReview.create({
      data: {
        evaluationId,
        result,
        reviewerId: userId
      }
    });
  }

  return res.status(200).end();
}

export default withSessionRoute(handler);
