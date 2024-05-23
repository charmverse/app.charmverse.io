import { prisma } from '@charmverse/core/prisma-client';
import { sealData } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { authSecret, baseUrl, docusignClientId, docusignOauthBaseUri } from 'config/constants';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, location: 'query', spaceIdKey: 'spaceId' }))
  .get(requestDocusignOAuthUrl);

/**
 * https://developers.docusign.com/platform/auth/reference/scopes/
 */
const scopes = ['impersonation', 'extended', 'signature', 'cors'];

async function requestDocusignOAuthUrl(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.spaceId as string;

  const sealedSpaceId = await sealData(spaceId, { password: authSecret as string, ttl: 60 * 60 });

  const oauthUri = `${docusignOauthBaseUri}/oauth/auth?response_type=code&scope=${scopes.join(
    encodeURIComponent(' ')
  )}&client_id=${docusignClientId}&redirect_uri=${encodeURIComponent(
    `${baseUrl}/api/docusign/callback`
  )}&state=${sealedSpaceId}`;

  return res.status(200).json({ url: oauthUri });
}

export default withSessionRoute(handler);
