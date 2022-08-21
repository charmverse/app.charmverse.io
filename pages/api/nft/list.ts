import { NftData } from 'lib/nft/types';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import * as alchemyApi from 'lib/blockchain/provider/alchemy';
import { withSessionRoute } from 'lib/session/withSession';
import { mapNftFromAlchemy } from 'lib/nft/utilities/mapNftFromAlchemy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getNfts);

async function getNfts (req: NextApiRequest, res: NextApiResponse<NftData[] | {error: string}>) {
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9'
  const { addresses } = req.session.user;
  const chainId = 1;
  const nfts = await alchemyApi.getNfts(['0x155b6485305ccab44ef7da58ac886c62ce105cf9'] || [], chainId);
  const mappedNfts = nfts.map(nft => mapNftFromAlchemy(nft, chainId));

  res.status(200).json(mappedNfts);
}

export default withSessionRoute(handler);
