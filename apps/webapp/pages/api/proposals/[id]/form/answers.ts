import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { getProposalFormAnswers } from '@packages/lib/proposals/forms/getProposalFormAnswers';
import type { FieldAnswerInput } from '@packages/lib/proposals/forms/interfaces';
import { upsertProposalFormAnswers } from '@packages/lib/proposals/forms/upsertProposalFormAnswers';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from '@packages/lib/proposals/rubric/interfaces';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { NotFoundError, ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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
