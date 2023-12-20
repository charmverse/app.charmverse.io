import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getAnswersTable } from 'lib/proposal/rubric/getAnswersTable';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import type { RubricAnswerUpsert } from 'lib/proposal/rubric/upsertRubricAnswers';
import { upsertRubricAnswers } from 'lib/proposal/rubric/upsertRubricAnswers';
import { withSessionRoute } from 'lib/session/withSession';

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

  const { answers, isDraft } = req.body as RubricAnswerUpsert;

  await upsertRubricAnswers({
    isDraft,
    proposalId,
    answers,
    userId
  });

  res.status(200).end();
}

async function deleteRubricAnswers(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const isDraft = req.query.isDraft === 'true';

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
      proposalId
    }
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
