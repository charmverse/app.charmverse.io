import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CharmVerseCredentialInput } from 'lib/credentials/attest';
import { signCharmverseCredential } from 'lib/credentials/attest';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(attestController);

async function attestController(req: NextApiRequest, res: NextApiResponse) {
  const signed = await signCharmverseCredential(req.body as CharmVerseCredentialInput);

  return res.status(201).json(signed);
}

export default withSessionRoute(handler);
