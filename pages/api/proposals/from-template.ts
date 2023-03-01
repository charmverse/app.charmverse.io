import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { computeProposalCategoryPermissions } from 'lib/permissions/proposals/computeProposalCategoryPermissions';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';
import { createProposalFromTemplate } from 'lib/proposal/createProposalFromTemplate';
import { ProposalNotFoundError } from 'lib/proposal/errors';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<CreateProposalFromTemplateInput>(['spaceId', 'templateId'], 'body'))
  .post(createProposalFromTemplateController);

async function createProposalFromTemplateController(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId, templateId } = req.body as CreateProposalFromTemplateInput;

  const userId = req.session.user.id;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: templateId
    },
    select: {
      categoryId: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(templateId);
  }
  const permissions = await computeProposalCategoryPermissions({
    resourceId: proposal.categoryId as string,
    userId
  });

  if (!permissions.create_proposal) {
    throw new UnauthorisedActionError('You cannot create new pages');
  }

  const { page: newPage } = await createProposalFromTemplate({
    templateId,
    spaceId,
    createdBy: userId
  });

  return res.status(201).json(newPage);
}

export default withSessionRoute(handler);
