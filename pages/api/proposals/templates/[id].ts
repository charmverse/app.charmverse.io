import { NotFoundError } from '@packages/nextjs/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { getProposalTemplate } from 'lib/proposals/getProposalTemplate';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getTemplateController);

async function getTemplateController(req: NextApiRequest, res: NextApiResponse<ProposalWithUsersAndRubric>) {
  const pageId = req.query.id as string;
  const userId = req.session.user?.id as string | undefined;

  if (!pageId) {
    throw new InvalidInputError('Page ID is required');
  }

  const proposal = await getProposalTemplate({ pageId });

  const { isAdmin } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId
  });

  if (proposal.archived && !isAdmin) {
    throw new NotFoundError();
  }

  return res.status(200).json(proposal);
}

export default withSessionRoute(handler);
