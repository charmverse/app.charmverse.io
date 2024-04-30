import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createEnvelopeSigningLink } from 'lib/docusign/api';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['envelopeId'], 'body')).post(signingLinkController);

async function signingLinkController(req: NextApiRequest, res: NextApiResponse) {
  const url = await createEnvelopeSigningLink({ envelopeId: req.body.envelopeId as string });

  // const spaceId = req.query.spaceId as string;

  return res.status(200).json({ url });
}

export default withSessionRoute(handler);
