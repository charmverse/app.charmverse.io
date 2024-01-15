import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { isProdEnv } from 'config/constants';
import type { CharmVerseCredentialInput } from 'lib/credentials/attest';
import { signAndPublishCharmverseCredential } from 'lib/credentials/attest';
import { getCredentialsByRecipient } from 'lib/credentials/queriesAndMutations';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getCredentialsController).post(attestController);

async function getCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await getCredentialsByRecipient({ recipient: req.query.account as string });
  return res.status(200).json(credentials);
}

// TODO Test endpoint for generating a credential - remove later
async function attestController(req: NextApiRequest, res: NextApiResponse) {
  if (isProdEnv) {
    throw new Error('This endpoint is only available in test environments');
  }

  const signed = await signAndPublishCharmverseCredential(req.body as CharmVerseCredentialInput);
  return res.status(201).json(signed);
}

export default withSessionRoute(handler);
