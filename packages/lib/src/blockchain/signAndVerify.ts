import { log } from '@packages/core/log';
import { InvalidInputError } from '@packages/utils/errors';
import { SiweMessage } from 'siwe';
import { hashMessage, parseAbi } from 'viem';

import { getPublicClient } from './publicClient';

export type SignatureVerificationPayload = {
  message: SiweMessage;
  signature: `0x${string}`;
};

/**
 * An external address is necessary from SiweMessage content as we can't rely on the address in the message for EIP-712 signature verification
 */
export type SignatureVerificationPayloadWithAddress = SignatureVerificationPayload & {
  address: string;
};

export async function getSiweFields({ message, signature, domain }: SignatureVerificationPayload & { domain: string }) {
  const siweMessage = new SiweMessage(message);
  const fields = await siweMessage.verify({ signature, domain });

  return fields;
}

/**
 * Use this for validating wallet signatures
 */
export async function isValidWalletSignature({
  message,
  signature,
  domain
}: SignatureVerificationPayload & { domain: string }): Promise<boolean> {
  if (!message || !signature || !domain) {
    throw new InvalidInputError('A wallet address, host and signature are required');
  }

  try {
    const fields = await getSiweFields({ message, signature, domain });
    if (fields.success) {
      return true;
    }
  } catch (err: any) {
    log.error('Error validating wallet signature', { error: err.error });
  }

  return false;
}

const EIP1271_MAGIC_VALUE = '0x1626ba7e';

const gnosisEipVerifyAbi = parseAbi([
  'function isValidSignature(bytes32 _messageHash, bytes _signature) public view returns (bytes4)'
]);

/**
 * Used for validating Gnosis Safe signatures
 */
export async function verifyEIP1271Signature({
  message,
  signature,
  address
}: SignatureVerificationPayloadWithAddress): Promise<boolean> {
  const siweMessage = new SiweMessage(message);
  const chainId = siweMessage.chainId;
  const parsedMessage = siweMessage.toMessage();

  const messageHash = hashMessage(parsedMessage);
  const client = getPublicClient(chainId);

  const data = await client
    .readContract({
      address: address as any,
      account: address as any,
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

export async function isValidEoaOrGnosisWalletSignature({
  message,
  signature,
  address,
  domain
}: SignatureVerificationPayloadWithAddress & {
  domain: string;
}): Promise<boolean> {
  const isValidSignature = await isValidWalletSignature({
    message,
    signature,
    domain
  });

  if (isValidSignature) {
    return true;
  }

  const isValidGnosisSignature = await verifyEIP1271Signature({
    message,
    signature,
    address
  });

  if (isValidGnosisSignature) {
    return true;
  }

  return false;
}
