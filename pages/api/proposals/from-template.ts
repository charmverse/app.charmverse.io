
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';
import { createProposalFromTemplate } from 'lib/proposal/createProposalFromTemplate';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<CreateProposalFromTemplateInput>(['spaceId', 'templateId'], 'body'))
  .use(requireSpaceMembership())
  .post(createProposalFromTemplateController);

async function createProposalFromTemplateController (req: NextApiRequest, res: NextApiResponse) {

  const { spaceId, templateId } = req.body as CreateProposalFromTemplateInput;

  const userId = req.session.user.id;

  const permissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: spaceId,
    userId
  });

  if (!permissions.createVote) {
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
