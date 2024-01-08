import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CharmVerseCredentialInput } from 'lib/credentials/attest';
import { signAndPublishCharmverseCredential } from 'lib/credentials/attest';
import { publishSignedCredential } from 'lib/credentials/config/queriesAndMutations';
import { getReceivedCredentials } from 'lib/credentials/connectToCeramic';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getCredentialsController).post(attestController);

async function getCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await getReceivedCredentials({ account: req.query.account as string });
  return res.status(201).json(credentials);
}

async function attestController(req: NextApiRequest, res: NextApiResponse) {
  const signed = await signAndPublishCharmverseCredential(req.body as CharmVerseCredentialInput);
  return res.status(201).json(signed);
}

export default withSessionRoute(handler);
