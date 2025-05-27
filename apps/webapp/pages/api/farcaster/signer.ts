import { SIGNED_KEY_REQUEST_TYPE, SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN, CastId } from '@farcaster/core';
import * as http from '@packages/adapters/http';
import { isProdEnv } from '@packages/config/constants';
import { createHexKeyPair } from '@packages/lib/farcaster/createHexKeyPair';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { encryptData } from '@packages/utils/dataEncryption';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { mnemonicToAccount } from 'viem/accounts';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(createSigner);

export type FarcasterSignerResponse = {
  signature: string;
  privateKey: string;
  publicKey: string;
  deadline: number;
  token: string;
  deeplinkUrl: string;
};
// @charmconnect
const appFid = 750569;
const deadline = Math.floor(Date.now() / 1000) + 86400 * 365 * 1; // 1 year

async function createSigner(req: NextApiRequest, res: NextApiResponse<FarcasterSignerResponse>) {
  const account = mnemonicToAccount(process.env.FARCASTER_ACCOUNT_SEED_PHRASE!);
  const keypairString = await createHexKeyPair();
  const publicKey = (
    keypairString.publicKey.startsWith('0x') ? keypairString.publicKey : `0x${keypairString.publicKey}`
  ) as `0x${string}`;

  const signature = await account.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE
    },
    primaryType: 'SignedKeyRequest',
    message: {
      requestFid: BigInt(appFid),
      key: publicKey,
      deadline: BigInt(deadline)
    }
  });

  const {
    result: { signedKeyRequest }
  } = await http.POST<{
    result: { signedKeyRequest: { token: string; deeplinkUrl: string } };
  }>(
    `https://api.warpcast.com/v2/signed-key-requests`,
    {
      key: publicKey,
      signature,
      requestFid: BigInt(appFid).toString(),
      deadline: BigInt(deadline).toString()
    },
    {
      credentials: 'omit'
    }
  );

  return res.status(200).json({
    signature: encryptData(signature),
    publicKey,
    privateKey: encryptData(keypairString.privateKey),
    deadline,
    token: signedKeyRequest.token,
    deeplinkUrl: signedKeyRequest.deeplinkUrl
  });
}

export default withSessionRoute(handler);
