import { SiweMessage } from 'lit-siwe';
import { getAddress, hashMessage, parseAbi, recoverMessageAddress } from 'viem';

import { InvalidInputError } from '../utils/errors';
import { lowerCaseEqual } from '../utils/strings';

import type { AuthSig } from './interfaces';
import { getPublicClient } from './publicClient';

/**
 * @host - Domain prefixed with protocol ie. http://localhost:3000
 */
export type SignatureToGenerate = {
  address: string;
  chainId: number;
  host: string;
};

export type SignaturePayload = {
  domain: string;
  address: string; // convert to EIP-55 format or else SIWE complains
  uri: string;
  version: '1';
  chainId: number;
  nonce?: string;
  issuedAt?: string;
};

export function generateSignaturePayload({ address, chainId, host }: SignatureToGenerate): SignaturePayload {
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
};

/**
 * Use this for validating wallet signatures
 */
export async function isValidWalletSignature({ address, host, signature }: SignatureVerification): Promise<boolean> {
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

  const signatureAddress = await recoverMessageAddress({ message: body, signature: signature.sig });

  if (!lowerCaseEqual(signatureAddress, address)) {
    return false;
  }

  return true;
}

const EIP1271_MAGIC_VALUE = '0x1626ba7e';

const gnosisEipVerifyAbi = parseAbi([
  'function isValidSignature(bytes32 _messageHash, bytes _signature) public view returns (bytes4)'
]);

export async function verifyEIP1271Signature({
  message,
  signature,
  safeAddress
}: {
  message: string;
  signature: string;
  safeAddress: string;
}): Promise<boolean> {
  const chainId = parseInt(message.split('Chain ID:')[1]?.split('\n')[0]?.trim());

  const messageHash = hashMessage(message);

  const client = getPublicClient(chainId);

  const data = await client
    .readContract({
      address: safeAddress as any,
      account: safeAddress as any,
      abi: gnosisEipVerifyAbi,
      args: messageHash ? [messageHash, signature] : (null as any),
      functionName: 'isValidSignature'
    })
    .catch((err) => {
      // We might be trying to read a contract that does not exist
      return null;
    });

  return data === EIP1271_MAGIC_VALUE;
}
