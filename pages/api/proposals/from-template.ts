import { prisma } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';
import { createProposalFromTemplate } from 'lib/proposal/createProposalFromTemplate';
import { ProposalNotFoundError } from 'lib/proposal/errors';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'spaceId',
      location: 'body',
      resourceIdType: 'space'
    })
  )
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
  const permissions = await req.basePermissionsClient.proposals.computeProposalCategoryPermissions({
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
