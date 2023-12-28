import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ProposalRubricCriteriaWithTypedParams } from 'lib/proposal/rubric/interfaces';
import type { RubricCriteriaUpsert } from 'lib/proposal/rubric/upsertRubricCriteria';
import { upsertRubricCriteria } from 'lib/proposal/rubric/upsertRubricCriteria';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(upsertProposalCriteriaController);

async function upsertProposalCriteriaController(
  req: NextApiRequest,
  res: NextApiResponse<ProposalRubricCriteriaWithTypedParams[]>
) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.edit) {
    throw new ActionNotPermittedError(`You can't update this proposal.`);
  }

  const { rubricCriteria, evaluationId } = req.body as RubricCriteriaUpsert;

  await upsertRubricCriteria({
    proposalId,
    evaluationId,
    rubricCriteria
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
