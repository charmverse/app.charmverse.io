import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { PageWithProposal } from 'lib/pages';
import { computeProposalCategoryPermissions } from 'lib/permissions/proposals/computeProposalCategoryPermissions';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import { createProposal } from 'lib/proposal/createProposal';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createProposalController);

async function createProposalController(req: NextApiRequest, res: NextApiResponse<PageWithProposal>) {
  const proposaCreateProps = req.body as CreateProposalInput;

  const permissions = await computeProposalCategoryPermissions({
    resourceId: proposaCreateProps.categoryId,
    userId: req.session.user.id
  });

  if (!permissions.create_proposal) {
    throw new ActionNotPermittedError('You cannot create new proposals');
  }

  const proposalPage = await createProposal({
    ...req.body,
    userId: req.session.user.id
  });

  return res.status(201).json({
    ...proposalPage.page,
    proposal: proposalPage.proposal
  });
}

export default withSessionRoute(handler);
