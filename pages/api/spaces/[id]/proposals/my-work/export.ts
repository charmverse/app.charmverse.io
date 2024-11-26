import { exportMyProposals } from '@root/lib/proposals/exportMyProposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(exportUserProposalsController).use(requireSpaceMembership({ adminOnly: false }));

async function exportUserProposalsController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;
  const csvContent = await exportMyProposals({ spaceId, userId });

  return res.status(200).send(csvContent);
}

export default withSessionRoute(handler);
