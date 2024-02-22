import { InvalidInputError } from '@charmverse/core/errors';
import type { FormFieldAnswer } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { FieldAnswerInput } from 'components/common/form/interfaces';
import { upsertProposalFormAnswers } from 'lib/form/upsertProposalFormAnswers';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposalFormAnswers } from 'lib/proposal/form/getProposalFormAnswers';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalFormAnswersHandler).use(requireUser).put(upsertProposalFormAnswersHandler);

async function getProposalFormAnswersHandler(req: NextApiRequest, res: NextApiResponse<FormFieldAnswer[]>) {
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
    throw new InvalidInputError(`Proposal ${proposalId} does not have a form`);
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
