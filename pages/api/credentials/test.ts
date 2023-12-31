import { InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CharmVerseCredentialInput } from 'lib/credentials/attest';
import { signCharmverseCredential } from 'lib/credentials/attest';
import {
  getReceivedCredentials,
  parseCeramicRecord,
  saveToCeramic,
  writeToCeramic
} from 'lib/credentials/connectToCeramic';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getCredentialsController).post(attestController);

async function getCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await getReceivedCredentials({ account: req.query.account as string });
  return res.status(201).json(credentials);
}

async function attestController(req: NextApiRequest, res: NextApiResponse) {
  // throw new InvalidInputError('This endpoint is blocked temporarily');

  const result = await parseCeramicRecord(req.body);
  // const result = await writeToCeramic(req.body);

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
