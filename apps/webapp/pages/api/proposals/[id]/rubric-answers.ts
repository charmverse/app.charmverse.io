import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { getAnswersTable } from '@packages/lib/proposals/rubric/getAnswersTable';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from '@packages/lib/proposals/rubric/interfaces';
import type { RubricAnswerUpsert } from '@packages/lib/proposals/rubric/upsertRubricAnswers';
import { upsertRubricAnswers } from '@packages/lib/proposals/rubric/upsertRubricAnswers';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(upsertProposalAnswersController).delete(deleteRubricAnswers);

async function upsertProposalAnswersController(
  req: NextApiRequest,
  res: NextApiResponse<ProposalRubricCriteriaAnswerWithTypedResponse[]>
) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.evaluate) {
    throw new ActionNotPermittedError(`You cannot update your answer for this proposal`);
  }

  const { answers, evaluationId, isDraft } = req.body as RubricAnswerUpsert;

  await upsertRubricAnswers({
    isDraft,
    evaluationId,
    proposalId,
    answers,
    userId
  });

  res.status(200).end();
}

async function deleteRubricAnswers(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const isDraft = req.query.isDraft === 'true';
  const evaluationId = req.query.evaluationId as string;

  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.evaluate) {
    throw new ActionNotPermittedError(`You cannot update your answer for this proposal`);
  }
  await getAnswersTable({ isDraft }).deleteMany({
    where: {
      userId,
      proposalId,
      evaluationId
    }
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
