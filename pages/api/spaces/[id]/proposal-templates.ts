import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { ProposalTemplateMeta } from 'lib/proposals/getProposalTemplates';
import { getProposalTemplates } from 'lib/proposals/getProposalTemplates';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalTemplatesController);

async function getProposalTemplatesController(req: NextApiRequest, res: NextApiResponse<ProposalTemplateMeta[]>) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;

  const proposals = await getProposalTemplates({
    spaceId,
    userId
  });

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
