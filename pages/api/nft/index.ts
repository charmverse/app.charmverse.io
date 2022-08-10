import { NftData } from 'lib/nft/types';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { alchemyApi } from 'lib/blockchain/provider/alchemy';
import { withSessionRoute } from 'lib/session/withSession';
import { mapNftFromAlchemy } from 'lib/nft/utilities/mapNftFromAlchemy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getNfts);

async function getNfts (req: NextApiRequest, res: NextApiResponse<NftData | {error: string}>) {
  const { tokenId, contractAddress } = req.query;
  const chainId = 1;

  if (typeof tokenId !== 'string' || typeof contractAddress !== 'string') {
    res.status(400).json({ error: 'Invalid NFT params' });
    return;
  }

  const nft = await alchemyApi.getNft(contractAddress, tokenId, chainId);
  const mappedNft = mapNftFromAlchemy(nft, chainId);

  res.status(200).json(mappedNft);
}

export default withSessionRoute(handler);
