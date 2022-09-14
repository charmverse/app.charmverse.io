import { prisma } from 'db';
import { InvalidStateError, onError, onNoMatch } from 'lib/middleware';
import { getNFTs } from 'lib/blockchain/nfts';
import { NftData } from 'lib/blockchain/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { RPCList } from 'connectors';
import { SupportedChainId, SupportedChainIds } from 'lib/blockchain/provider/alchemy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getNFTsMiddleware);

async function getNFTsMiddleware (req: NextApiRequest, res: NextApiResponse<NftData[] | {error: string}>) {
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9'
  const userId = req.query.userId as string;

  const hiddenNftIds: string[] = (await prisma.profileItem.findMany({
    where: {
      userId,
      isHidden: true,
      type: 'nft'
    },
    select: {
      id: true
    }
  })).map(p => p.id);

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
  const mappedNfts = (await Promise.all(
    RPCList.filter(rpc => SupportedChainIds.includes(rpc.chainId as any)).map(rpc => getNFTs(addresses, rpc.chainId as SupportedChainId))
  )).flat();

  res.status(200).json(mappedNfts.map(nft => ({
    ...nft,
    isHidden: hiddenNftIds.includes(nft.id)
  })));
}

export default withSessionRoute(handler);
