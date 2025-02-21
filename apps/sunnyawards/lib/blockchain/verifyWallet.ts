import { log } from '@charmverse/core/log';
import { InvalidStateError } from '@packages/nextjs/errors';
import { SiweMessage } from 'siwe';

import type { AuthSchema } from './config';

export async function verifyWalletSignature({ message, signature }: AuthSchema): Promise<{ walletAddress: string }> {
  try {
    const siweMessage = new SiweMessage(message);
    const verifiedMessage = await siweMessage.verify({ signature });

    if (verifiedMessage?.error || !verifiedMessage.success || !verifiedMessage.data?.address) {
      throw new InvalidStateError('Invalid wallet signature');
    } else {
      return { walletAddress: verifiedMessage.data.address };
    }
  } catch (err: any) {
    log.warn('Error verifying wallet signature', { error: err });
    throw new InvalidStateError('Invalid wallet signature');
  }
}
