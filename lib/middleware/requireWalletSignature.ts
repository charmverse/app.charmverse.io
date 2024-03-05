import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import type { SignatureVerificationPayload } from 'lib/blockchain/signAndVerify';
import { isValidWalletSignature } from 'lib/blockchain/signAndVerify';

import { MissingDataError } from '../utils/errors';

export async function requireWalletSignature(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const domain = req.headers.host as string;
  const { message, signature } = req.body as SignatureVerificationPayload;

  const isValidSignature = await isValidWalletSignature({
    message,
    signature,
    domain
  });

  if (!isValidSignature) {
    throw new MissingDataError('Invalid wallet signature');
  } else {
    next();
  }
}
