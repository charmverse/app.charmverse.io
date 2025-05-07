import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { generateDocusignOAuthUrl } from '@packages/lib/docusign/generateDocusignOAuthUrl';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, location: 'query', spaceIdKey: 'spaceId' }))
  .get(requestDocusignOAuthUrl);

async function requestDocusignOAuthUrl(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.spaceId as string;

  const url = await generateDocusignOAuthUrl({
    spaceId,
    userId: req.session.user.id
  });

  return res.status(200).json({ url });
}

export default withSessionRoute(handler);
