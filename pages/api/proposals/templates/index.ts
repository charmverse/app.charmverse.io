import type { PageWithPermissions } from '@charmverse/core/pages';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { logFirstProposalTemplate } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { CreateProposalTemplateInput } from 'lib/templates/proposals/createProposalTemplate';
import { createProposalTemplate } from 'lib/templates/proposals/createProposalTemplate';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(
  requireKeys<CreateProposalTemplateInput>(['spaceId'], 'body'),
  requireSpaceMembership({
    adminOnly: true
  }),
  createProposalTemplateController
);

async function createProposalTemplateController(req: NextApiRequest, res: NextApiResponse<PageWithPermissions>) {
  const userId = req.session.user.id;

  const { spaceId, categoryId, pageContent, reviewers } = req.body as CreateProposalTemplateInput;

  const proposal = await createProposalTemplate({ spaceId, userId, categoryId, pageContent, reviewers });

  logFirstProposalTemplate({ userId, spaceId });

  res.status(201).send(proposal);
}

export default withSessionRoute(handler);
