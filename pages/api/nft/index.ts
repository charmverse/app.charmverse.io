import { NftData } from 'lib/nft/types';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import * as alchemyApi from 'lib/blockchain/provider/alchemy';
import { withSessionRoute } from 'lib/session/withSession';
import { mapNftFromAlchemy } from 'lib/nft/utilities/mapNftFromAlchemy';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getNfts);

async function getNfts (req: NextApiRequest, res: NextApiResponse<NftData | {error: string}>) {
  const { tokenId, contractAddress } = req.query;
  const chainId = 1;

  if (typeof tokenId !== 'string' || typeof contractAddress !== 'string') {
    throw new InvalidInputError('Invalid NFT params');
  }

  const nft = await alchemyApi.getNft(contractAddress, tokenId, chainId);
  const mappedNft = mapNftFromAlchemy(nft, chainId);

  res.status(200).json(mappedNft);
}

export default withSessionRoute(handler);
