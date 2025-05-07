import { exportMyProposals } from '@packages/lib/proposals/exportMyProposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(exportUserProposalsController).use(requireSpaceMembership({ adminOnly: false }));

async function exportUserProposalsController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;
  const csvContent = await exportMyProposals({ spaceId, userId });

  return res.status(200).send(csvContent);
}

export default withSessionRoute(handler);
