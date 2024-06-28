import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { disconnectDocusignAccount } from 'lib/docusign/authentication';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, location: 'query', spaceIdKey: 'spaceId' }))
  .delete(disconnectDocusignController);

async function disconnectDocusignController(req: NextApiRequest, res: NextApiResponse) {
  await disconnectDocusignAccount({ spaceId: req.query.spaceId as string });

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
