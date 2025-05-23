import { exportProposals } from '@packages/lib/proposals/exportProposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(exportProposalsHandler)
  .use(
    requireSpaceMembership({
      adminOnly: false
    })
  );

async function exportProposalsHandler(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const userId = req.session.user?.id;
  const csvContent = await exportProposals({ spaceId, userId });
  return res.status(200).send(csvContent);
}

export default withSessionRoute(handler);
