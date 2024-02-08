import { SIGNED_KEY_REQUEST_TYPE, SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN } from '@farcaster/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { mnemonicToAccount } from 'viem/accounts';

import { isProdEnv } from 'config/constants';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(createSigner);

export type FarcasterSignerResponse = {
  signature: string;
  requestFid: number;
  deadline: number;
  requestSigner: string;
};

async function createSigner(req: NextApiRequest, res: NextApiResponse<FarcasterSignerResponse>) {
  const { publicKey } = req.body as {
    publicKey: `0x${string}`;
  };

  const appFid = isProdEnv ? 1501 : 318061;
  const account = mnemonicToAccount(process.env.FARCASTER_ACCOUNT_SEED_PHRASE!);

  const deadline = Math.floor(Date.now() / 1000) + 86400 * 365 * 50; // 50 years
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

  return res.status(200).json({
    signature,
    requestFid: appFid,
    deadline,
    requestSigner: account.address
  });
}

export default withSessionRoute(handler);
