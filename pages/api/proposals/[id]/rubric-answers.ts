import { InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { getAnswersTable } from 'lib/proposal/rubric/getAnswersTable';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import type { RubricAnswerUpsert } from 'lib/proposal/rubric/upsertRubricAnswers';
import { upsertRubricAnswers } from 'lib/proposal/rubric/upsertRubricAnswers';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .put(upsertProposalAnswersController)
  .delete(deleteRubricAnswers);

async function upsertProposalAnswersController(
  req: NextApiRequest,
  res: NextApiResponse<ProposalRubricCriteriaAnswerWithTypedResponse[]>
) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
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

  const userId = req.session.user.id;

  const permissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
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
