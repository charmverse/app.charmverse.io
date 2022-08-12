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

async function getNfts (req: NextApiRequest, res: NextApiResponse<NftData[] | {error: string}>) {
  const { addresses } = req.session.user;
  const chainId = 1;

  const nfts = await alchemyApi.getNfts(addresses || [], chainId);
  const mappedNfts = nfts.map(nft => mapNftFromAlchemy(nft, chainId));

  res.status(200).json(mappedNfts);
}

export default withSessionRoute(handler);
