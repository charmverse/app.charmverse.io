import { MissingDataError } from '@packages/utils/errors';
import type { SignatureVerificationPayloadWithAddress } from '@packages/lib/blockchain/signAndVerify';
import {
  isValidWalletSignature,
  verifyEIP1271Signature,
  isValidEoaOrGnosisWalletSignature
} from '@packages/lib/blockchain/signAndVerify';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

export async function requireWalletSignature(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const domain = req.headers.host as string;
  const { message, signature, address } = req.body as SignatureVerificationPayloadWithAddress;

  const isValidSignature = await isValidEoaOrGnosisWalletSignature({ address, domain, message, signature });

  if (!isValidSignature) {
    throw new MissingDataError('Invalid wallet signature');
  }

  return next();
}
