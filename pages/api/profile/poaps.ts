
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { ExtendedPoap } from 'lib/blockchain/interfaces';
import { getPOAPs } from 'lib/blockchain/poaps';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

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

  const wallets = await prisma.userWallet.findMany({
    where: {
      userId: req.session.user.id
    }
  });

  const poaps = await getPOAPs(wallets.map(w => w.address));
  const poapsWithHidden = poaps.map(poap => ({
    ...poap,
    isHidden: hiddenPoapIDs.includes(poap.id)
  }));

  return res.status(200).json(poapsWithHidden);
}

export default withSessionRoute(handler);
