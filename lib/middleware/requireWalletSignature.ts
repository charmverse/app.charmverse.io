import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import type { AuthSig } from 'lib/blockchain/interfaces';
import { isValidWalletSignature, verifyEIP1271Signature } from 'lib/blockchain/signAndVerify';

import { MissingDataError } from '../utils/errors';

export type Web3LoginRequest = {
  address: string;
  walletSignature: AuthSig;
};

export async function requireWalletSignature(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const { address, walletSignature } = req.body as Web3LoginRequest;

  if (!address || !walletSignature) {
    throw new MissingDataError('Please provide an address and wallet signature');
  }

  const isValidSignature = await isValidWalletSignature({
    address,
    signature: walletSignature,
    host: req.headers.origin as string
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
