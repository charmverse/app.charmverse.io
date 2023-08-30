import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import type { RubricAnswerUpsert } from 'lib/proposal/rubric/upsertRubricAnswers';
import { upsertRubricAnswers } from 'lib/proposal/rubric/upsertRubricAnswers';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .put(upsertProposalAnswersController)
  .delete(deleteRubricAnswer);

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

  const { answers } = req.body as RubricAnswerUpsert;

  await upsertRubricAnswers({
    proposalId,
    answers,
    userId
  });

  res.status(200).end();
}

async function deleteRubricAnswer(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;

  const rubricCriteriaId = req.body.rubricCriteriaId;

  if (!rubricCriteriaId) {
    throw new InvalidInputError(`Valid rubric criteria id is required`);
  }

  const userId = req.session.user.id;

  const permissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.evaluate) {
    throw new ActionNotPermittedError(`You cannot update your answer for this proposal`);
  }

  await prisma.proposalRubricCriteriaAnswer.delete({
    where: {
      userId_rubricCriteriaId: {
        userId,
        rubricCriteriaId
      }
    }
  });

  res.status(200).send({ message: 'ok' });
}

export default withSessionRoute(handler);
