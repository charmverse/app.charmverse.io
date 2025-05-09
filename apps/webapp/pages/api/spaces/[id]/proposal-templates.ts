import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from '@packages/lib/middleware';
import type { ProposalTemplateMeta } from '@packages/lib/proposals/getProposalTemplates';
import { getProposalTemplates } from '@packages/lib/proposals/getProposalTemplates';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalTemplatesController);

async function getProposalTemplatesController(req: NextApiRequest, res: NextApiResponse<ProposalTemplateMeta[]>) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;
  const detailed = req.query.detailed === 'true';

  const proposals = await getProposalTemplates({
    spaceId,
    userId,
    evaluationsAndFormFields: detailed
  });

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
