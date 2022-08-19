
import { Poap } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { getPOAPs, GetPoapsResponse, UpdatePoapsRequest } from 'lib/poap';
import { InvalidStateError } from 'lib/middleware/errors';
import nc from 'next-connect';
import { v4 as uuid } from 'uuid';
import { ExtendedPoap } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getUserPoaps)
  .put(updateUserPoaps);

async function getUserPoaps (req: NextApiRequest, res: NextApiResponse<GetPoapsResponse | { error: any }>) {
  const hiddenPoapIDs: Array<string> = (await prisma.poap.findMany({
    where: {
      userId: req.session.user.id,
      isHidden: true
    },
    select: {
      tokenId: true
    }
  })).map(p => p.tokenId);

  const user = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    select: {
      addresses: true
    }
  });

  if (!user) {
    throw new InvalidStateError('User not found');
  }

  const poaps: Partial<ExtendedPoap>[] = await getPOAPs(user.addresses);

  const hiddenPoaps = poaps.filter((poap: Partial<ExtendedPoap>) => hiddenPoapIDs.find((tokenId :string) => poap.tokenId === tokenId));
  const visiblePoaps = poaps.filter((poap: Partial<ExtendedPoap>) => !hiddenPoapIDs.find((tokenId :string) => poap.tokenId === tokenId));

  return res.status(200).json({
    hiddenPoaps,
    visiblePoaps
  });
}

async function updateUserPoaps (req: NextApiRequest, res: NextApiResponse<any | {error: string}>) {

  const { newShownPoaps, newHiddenPoaps }: UpdatePoapsRequest = req.body;

  if (newShownPoaps.length) {
    const ids: Array<string> = newShownPoaps.map((poap: Partial<ExtendedPoap>) => poap.tokenId || '');
    await prisma.poap.deleteMany({
      where: {
        tokenId: {
          in: ids
        }
      }
    });
  }

  if (newHiddenPoaps.length) {
    await prisma.poap.createMany({
      data: newHiddenPoaps.map(poap => ({
        id: uuid(),
        tokenId: poap.tokenId,
        walletAddress: poap.walletAddress,
        userId: req.session.user.id,
        isHidden: true
      }) as Poap)
    });
  }

  return res.status(200).json({});
}

export default withSessionRoute(handler);
