import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DocusignEnvelopeLinkRequest } from 'lib/docusign/api';
import { requestEnvelopeSigningLink } from 'lib/docusign/api';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, location: 'body', spaceIdKey: 'spaceId' }))
  .use(requireKeys(['docusignEnvelopeId', 'signerEmail'], 'body'))
  .post(signingLinkController);

async function signingLinkController(req: NextApiRequest, res: NextApiResponse) {
  const url = await requestEnvelopeSigningLink(req.body as DocusignEnvelopeLinkRequest);

  return res.status(200).json({ url });
}

export default withSessionRoute(handler);
