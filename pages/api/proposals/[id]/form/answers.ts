import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { getProposalFormAnswers } from '@root/lib/proposals/forms/getProposalFormAnswers';
import type { FieldAnswerInput } from '@root/lib/proposals/forms/interfaces';
import { upsertProposalFormAnswers } from '@root/lib/proposals/forms/upsertProposalFormAnswers';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposals/rubric/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalFormAnswersHandler).use(requireUser).put(upsertProposalFormAnswersHandler);

async function getProposalFormAnswersHandler(req: NextApiRequest, res: NextApiResponse<FieldAnswerInput[]>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user?.id;

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    select: {
      formId: true,
      spaceId: true,
      page: { select: { id: true, sourceTemplateId: true } }
    }
  });

  if (!proposal.formId) {
    // return empty list instead of an error
    return res.status(200).json([]);
  }

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (permissions.view !== true) {
    throw new NotFoundError();
  }

  const answers = await getProposalFormAnswers({
    proposalId,
    canViewPrivateFields: permissions.view_private_fields
  });

  return res.status(200).json(answers);
}

async function upsertProposalFormAnswersHandler(
  req: NextApiRequest,
  res: NextApiResponse<ProposalRubricCriteriaAnswerWithTypedResponse[]>
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

  const { answers } = req.body as { answers: FieldAnswerInput[] };

  await upsertProposalFormAnswers({ answers, proposalId });

  res.status(200).end();
}

export default withSessionRoute(handler);
