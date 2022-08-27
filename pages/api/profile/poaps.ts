
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { InvalidStateError } from 'lib/middleware/errors';
import { getPOAPs, GetPoapsResponse, UpdatePoapsRequest } from 'lib/poap';
import { withSessionRoute } from 'lib/session/withSession';
import { ExtendedPoap } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getUserPoaps)
  .put(updateUserPoaps);

async function getUserPoaps (req: NextApiRequest, res: NextApiResponse<GetPoapsResponse | { error: any }>) {
  const hiddenPoapIDs: Array<string> = (await prisma.profileItem.findMany({
    where: {
      userId: req.session.user.id,
      isHidden: true
    },
    select: {
      id: true
    }
  })).map(p => p.id);

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

  const poaps: ExtendedPoap[] = await getPOAPs(user.addresses);

  const hiddenPoaps = poaps.filter((poap: ExtendedPoap) => hiddenPoapIDs.includes(poap.tokenId));
  const visiblePoaps = poaps.filter((poap: ExtendedPoap) => !hiddenPoapIDs.includes(poap.tokenId));

  return res.status(200).json({
    hiddenPoaps,
    visiblePoaps
  });
}

async function updateUserPoaps (req: NextApiRequest, res: NextApiResponse<any | {error: string}>) {

  const { newShownPoaps, newHiddenPoaps }: UpdatePoapsRequest = req.body;

  if (newShownPoaps.length) {
    const ids: Array<string> = newShownPoaps.map((poap: Partial<ExtendedPoap>) => poap.tokenId || '');
    await prisma.profileItem.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });
  }

  if (newHiddenPoaps.length) {
    await prisma.profileItem.createMany({
      data: newHiddenPoaps.map(poap => ({
        id: poap.tokenId,
        walletAddress: poap.walletAddress,
        userId: req.session.user.id,
        isHidden: true,
        type: 'poap'
      }))
    });
  }

  return res.status(200).json({});
}

export default withSessionRoute(handler);
