import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getNFT } from 'lib/blockchain/getNFTs';
import type { NFTData, NFTRequest } from 'lib/blockchain/getNFTs';
import { onError, onNoMatch } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getNFTsMiddleware);

type NFTRequestStrings = Pick<NFTRequest, 'address' | 'tokenId'> & { chainId: string };

async function getNFTsMiddleware(req: NextApiRequest, res: NextApiResponse<NFTData | null>) {
  const { address, tokenId, chainId } = req.query as NFTRequestStrings;
  const nft = await getNFT({
    address,
    tokenId,
    chainId: parseInt(chainId, 10) as NFTRequest['chainId']
  });

  res.status(200).json(nft);
}

export default handler;
