import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { requestEnvelopeSigningLink } from 'lib/docusign/api';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, location: 'body', spaceIdKey: 'spaceId' }))
  .use(requireKeys(['envelopeId'], 'body'))
  .post(signingLinkController);

async function signingLinkController(req: NextApiRequest, res: NextApiResponse) {
  const url = await requestEnvelopeSigningLink({
    docusignEnvelopeId: req.body.envelopeId as string,
    spaceId: req.body.spaceId as string
  });

  // const spaceId = req.query.spaceId as string;

  return res.status(200).json({ url });
}

export default withSessionRoute(handler);
