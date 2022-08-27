import { NftData } from 'lib/nft/types';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { InvalidStateError, onError, onNoMatch } from 'lib/middleware';
import * as alchemyApi from 'lib/blockchain/provider/alchemy';
import { withSessionRoute } from 'lib/session/withSession';
import { mapNftFromAlchemy } from 'lib/nft/utilities/mapNftFromAlchemy';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getNfts);

async function getNfts (req: NextApiRequest, res: NextApiResponse<NftData[] | {error: string}>) {
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9'
  const userId = req.query.userId as string;
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      addresses: true
    }
  });

  if (!user) {
    throw new InvalidStateError('User not found');
  }

  const { addresses } = user;
  const chainId = 1;
  const nfts = await alchemyApi.getNfts(['0x155b6485305ccab44ef7da58ac886c62ce105cf9'], chainId);
  const mappedNfts = nfts.map(nft => mapNftFromAlchemy(nft, chainId));

  res.status(200).json(mappedNfts);
}

export default withSessionRoute(handler);
