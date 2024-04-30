import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { PublicDocuSignProfile } from 'lib/docusign/authentication';
import {
  getSpaceDocusignCredentials,
  refreshAccessToken,
  saveUserDocusignOAuthToken
} from 'lib/docusign/authentication';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, location: 'body', spaceIdKey: 'spaceId' })).post(refreshToken);

async function refreshToken(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await getSpaceDocusignCredentials({
    spaceId: req.query.spaceId as string
  });

  await refreshAccessToken({
    refreshToken: credentials.refreshToken
  });

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
