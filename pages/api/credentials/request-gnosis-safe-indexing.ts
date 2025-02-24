import { saveGnosisSafeTransactionToIndex } from '@packages/credentials/indexGnosisSafeCredentialTransaction';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(
    requireSpaceMembership({ adminOnly: false, location: 'body' }),
    requestRewardCredentialsGnosisSafeIndexingController
  );

async function requestRewardCredentialsGnosisSafeIndexingController(req: NextApiRequest, res: NextApiResponse) {
  await saveGnosisSafeTransactionToIndex(req.body);
  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
