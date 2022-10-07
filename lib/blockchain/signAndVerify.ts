import { getAddress, verifyMessage } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';

import { InvalidInputError } from '../utilities/errors';
import { lowerCaseEqual } from '../utilities/strings';

import type { AuthSig } from './interfaces';

/**
 * @host - Domain prefixed with protocol ie. http://localhost:3000
 */
export type SignatureToGenerate = {
  address: string;
  chainId: number;
  host: string;
}

export type SignaturePayload = {
  domain: string;
  address: string; // convert to EIP-55 format or else SIWE complains
  uri: string;
  version: '1';
  chainId: number;
  nonce?: string;
  issuedAt?: string;
};

export function generateSignaturePayload ({ address, chainId, host }: SignatureToGenerate): SignaturePayload {

  const domain = host.match('https') ? host.split('https://')[1] : host.split('http://')[1];
  const uri = host;

  return {
    domain,
    address: getAddress(address), // convert to EIP-55 format or else SIWE complains
    uri,
    version: '1',
    chainId
  };
}

export type SignatureVerification = {
  address: string;
  host: string;
  signature: AuthSig;
}

/**
 * Use this for
 */
export function isValidWalletSignature ({ address, host, signature }: SignatureVerification): boolean {

  if (!address || !host || !signature) {
    throw new InvalidInputError('A wallet address, host and signature are required');
  }

  const chainId = signature.signedMessage.split('Chain ID:')[1]?.split('\n')[0]?.trim();
  const nonce = signature.signedMessage.split('Nonce:')[1]?.split('\n')[0]?.trim();
  const issuedAt = signature.signedMessage.split('Issued At:')[1]?.split('\n')[0]?.trim();

  const payload = {
    ...generateSignaturePayload({ address, chainId: parseInt(chainId), host }),
    nonce,
    issuedAt
  };

  const message = new SiweMessage(payload);

  const body = message.prepareMessage();

  const signatureAddress = verifyMessage(body, signature.sig);

  if (!lowerCaseEqual(signatureAddress, address)) {
    return false;
  }

  return true;

}
