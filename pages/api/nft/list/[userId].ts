import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getAllNFTs } from 'lib/blockchain/getNFTs';
import type { NftData } from 'lib/blockchain/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getNFTsMiddleware);

async function getNFTsMiddleware(req: NextApiRequest, res: NextApiResponse<NftData[] | { error: string }>) {
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9'
  const userId = req.query.userId as string;

  const nfts = await getAllNFTs(userId);

  res.status(200).json(nfts);
}

export default withSessionRoute(handler);
