import { InvalidInputError } from '@charmverse/core/errors';
import { isProposalAuthor } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { FieldAnswerInput } from 'components/common/form/interfaces';
import { upsertProposalFormAnswers } from 'lib/form/upsertProposalFormAnswers';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .put(upsertProposalFormAnswersHandler);

async function upsertProposalFormAnswersHandler(
  req: NextApiRequest,
  res: NextApiResponse<ProposalRubricCriteriaAnswerWithTypedResponse[]>
) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, include: { authors: true } });

  if (!proposal) {
    throw new InvalidInputError(`Proposal with id ${proposalId} does not exist`);
  }

  if (!proposal.formId) {
    throw new InvalidInputError(`Proposal ${proposalId} does not have a form`);
  }

  const isAuthor = isProposalAuthor({ userId, proposal });

  if (!isAuthor) {
    throw new ActionNotPermittedError('Only authors can edit proposal form answers');
  }

  const { answers } = req.body as { answers: FieldAnswerInput[] };

  await upsertProposalFormAnswers({ answers, formId: proposal.formId, proposalId });

  res.status(200).end();
}

export default withSessionRoute(handler);
