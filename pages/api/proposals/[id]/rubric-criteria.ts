import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { RubricCriteriaTyped } from 'lib/proposals/rubric/interfaces';
import type { RubricCriteriaUpsert } from 'lib/proposals/rubric/upsertRubricCriteria';
import { upsertRubricCriteria } from 'lib/proposals/rubric/upsertRubricCriteria';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utils/errors';

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
