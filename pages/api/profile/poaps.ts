
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { InvalidStateError } from 'lib/middleware/errors';
import { getPOAPs } from 'lib/blockchain/poaps';
import { withSessionRoute } from 'lib/session/withSession';
import { ExtendedPoap } from 'lib/blockchain/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getUserPoaps);

async function getUserPoaps (req: NextApiRequest, res: NextApiResponse<ExtendedPoap[]>) {
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

  const poaps = await getPOAPs(user.addresses);
  const poapsWithHidden = poaps.map(poap => ({
    ...poap,
    isHidden: hiddenPoapIDs.includes(poap.id)
  }));

  return res.status(200).json(poapsWithHidden);
}

export default withSessionRoute(handler);
