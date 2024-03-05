import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import type { SignatureVerificationPayload } from 'lib/blockchain/signAndVerify';
import { isValidWalletSignature, verifyEIP1271Signature } from 'lib/blockchain/signAndVerify';

import { MissingDataError } from '../utils/errors';

export async function requireWalletSignature(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const domain = req.headers.host as string;
  const { message, signature } = req.body as SignatureVerificationPayload;

  const isValidSignature = await isValidWalletSignature({
    message,
    signature,
    domain
  });

  if (isValidSignature) {
    return next();
  }

  const isValidGnosisSignature = await verifyEIP1271Signature({
    message: walletSignature.signedMessage,
    safeAddress: address,
    signature: walletSignature.sig
  });

  if (isValidGnosisSignature) {
    return next();
  }

  throw new MissingDataError('Invalid wallet signature');
}
