import type { SignatureVerificationPayloadWithAddress } from '@root/lib/blockchain/signAndVerify';
import { isValidWalletSignature, verifyEIP1271Signature } from '@root/lib/blockchain/signAndVerify';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { MissingDataError } from '../utils/errors';

export async function requireWalletSignature(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const domain = req.headers.host as string;
  const { message, signature, address } = req.body as SignatureVerificationPayloadWithAddress;

  const isValidSignature = await isValidWalletSignature({
    message,
    signature,
    domain
  });

  if (isValidSignature) {
    return next();
  }

  const isValidGnosisSignature = await verifyEIP1271Signature({
    message,
    signature,
    address
  });

  if (isValidGnosisSignature) {
    return next();
  }

  throw new MissingDataError('Invalid wallet signature');
}
