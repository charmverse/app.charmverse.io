
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { InvalidStateError } from 'lib/middleware/errors';
import { getPOAPs, GetPoapsResponse } from 'lib/poap';
import { withSessionRoute } from 'lib/session/withSession';
import { ExtendedPoap } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getUserPoaps);

async function getUserPoaps (req: NextApiRequest, res: NextApiResponse<GetPoapsResponse | { error: any }>) {
  const hiddenPoapIDs: string[] = (await prisma.profileItem.findMany({
    where: {
      userId: req.session.user.id,
      isHidden: true,
      type: 'poap'
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

  const hiddenPoaps = poaps.filter((poap) => hiddenPoapIDs.includes(poap.tokenId));
  const visiblePoaps = poaps.filter((poap) => !hiddenPoapIDs.includes(poap.tokenId));

  return res.status(200).json({
    hiddenPoaps,
    visiblePoaps
  });
}

export default withSessionRoute(handler);
