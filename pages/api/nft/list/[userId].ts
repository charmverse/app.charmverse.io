import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { NFTData } from 'lib/blockchain/getNFTs';
import { onError, onNoMatch } from 'lib/middleware';
import { getUserNFTs } from 'lib/profile/getUserNFTs';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getNFTsMiddleware);

async function getNFTsMiddleware(req: NextApiRequest, res: NextApiResponse<NFTData[] | { error: string }>) {
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9'
  const userId = req.query.userId as string;

  const nfts = await getUserNFTs(userId);

  res.status(200).json(nfts);
}

export default handler;
