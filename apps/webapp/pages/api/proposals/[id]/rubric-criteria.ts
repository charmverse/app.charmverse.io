import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { AdministratorOnlyError } from '@packages/users/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import type { RubricCriteriaTyped } from '@packages/lib/proposals/rubric/interfaces';
import type { RubricCriteriaUpsert } from '@packages/lib/proposals/rubric/upsertRubricCriteria';
import { upsertRubricCriteria } from '@packages/lib/proposals/rubric/upsertRubricCriteria';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(upsertProposalCriteriaController);

async function upsertProposalCriteriaController(req: NextApiRequest, res: NextApiResponse<RubricCriteriaTyped[]>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    include: {
      page: {
        select: {
          sourceTemplateId: true,
          type: true
        }
      }
    }
  });

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.edit) {
    throw new ActionNotPermittedError(`You can't update this proposal.`);
  }
  // Only admins can update proposal templates or proposals made from a template
  if ((proposal.page?.type === 'proposal_template' || proposal.page?.sourceTemplateId) && !isAdmin) {
    throw new AdministratorOnlyError();
  }

  const { rubricCriteria, evaluationId } = req.body as RubricCriteriaUpsert;

  if (!rubricCriteria || !evaluationId) {
    throw new InvalidInputError('Invalid request body');
  }

  await upsertRubricCriteria({
    proposalId,
    evaluationId,
    rubricCriteria,
    actorId: userId
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
