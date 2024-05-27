import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { baseUrl, docusignClientId, docusignOauthBaseUri } from 'config/constants';
import { encodeDocusignState } from 'lib/docusign/encodeAndDecodeDocusignState';
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

  const state = await encodeDocusignState({ spaceId, userId: req.session.user.id });

  const oauthUri = `${docusignOauthBaseUri}/oauth/auth?response_type=code&scope=${scopes.join(
    encodeURIComponent(' ')
  )}&client_id=${docusignClientId}&redirect_uri=${encodeURIComponent(
    `${baseUrl}/api/docusign/callback`
  )}&state=${state}`;

  return res.status(200).json({ url: oauthUri });
}

export default withSessionRoute(handler);
