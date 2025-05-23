import type { CastId } from '@farcaster/core';
import { NobleEd25519Signer, makeFrameAction, FarcasterNetwork, Message } from '@farcaster/core';

export async function createFrameActionMessageWithSignerKey(
  signerKey: string,
  {
    fid,
    url,
    buttonIndex,
    castId,
    inputText
  }: {
    fid: number;
    url: Uint8Array;
    buttonIndex: number;
    inputText: Uint8Array;
    castId: CastId | undefined;
  }
) {
  const signer = new NobleEd25519Signer(new Uint8Array(Buffer.from(signerKey.slice(2), 'hex')));

  const messageDataOptions = {
    fid,
    network: FarcasterNetwork.MAINNET
  };

  const message = await makeFrameAction(
    {
      url,
      buttonIndex,
      castId,
      inputText,
      // upgraded farcaster core. let's add dummy empty data for the following...
      state: new Uint8Array(),
      transactionId: new Uint8Array(),
      address: new Uint8Array()
    },
    messageDataOptions,
    signer
  );

  if (message.isErr()) {
    throw new Error(message.error.message);
  }

  const trustedBytes = Buffer.from(Message.encode(message._unsafeUnwrap()).finish()).toString('hex');

  return { message: message.unwrapOr(null), trustedBytes };
}
