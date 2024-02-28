import { log } from '@charmverse/core/log';
import { SiweMessage } from 'siwe';

import { InvalidInputError } from '../utils/errors';

/**
 * @domain - Domain prefixed with protocol ie. http://localhost:3000
 */
export type SignatureVerificationPayload = {
  message: SiweMessage;
  signature: `0x${string}`;
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

  const fields = await getSiweFields({ message, signature, domain });

  if (fields.success) {
    return true;
  }

  if (fields.error) {
    log.error('Error validating wallet signature', { error: fields.error });
  }

  return false;
}
