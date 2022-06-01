
import { Poap } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { getPOAPs, GetPoapsResponse } from 'lib/poap';

import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getUserPoaps)
  .put(updateUserPoaps);

async function getUserPoaps (req: NextApiRequest, res: NextApiResponse<GetPoapsResponse> | { error: any }) {
  const hiddenPoaps: Array<Partial<Poap>> = await prisma.poap.findMany({
    where: {
      userId: req.session.user.id,
      isHidden: true
    },
    select: {
      id: true
    }
  });

  const poaps = await getPOAPs(req.session.user.addresses);

  return res.status(200).json({
    hidden: hiddenPoaps,
    poaps
  });
}

async function updateUserPoaps (req: NextApiRequest, res: NextApiResponse<Array<string> | {error: string}>) {

  const { addedPoaps, removedPoaps }:
        { addedPoaps: Array<Partial<Poap>>, removedPoaps: Array<string> } = req.body;

  if (removedPoaps.length) {
    await prisma.poap.deleteMany({
      where: {
        id: {
          in: removedPoaps
        },
        userId: req.session.user.id
      }
    });
  }

  if (addedPoaps.length) {
    await prisma.poap.createMany({
      data: addedPoaps.map(poap => ({
        tokenId: poap.tokenId,
        walletAddress: poap.walletAddress,
        userId: req.session.user.id,
        isHidden: true
      }))
    });
  }

  const poaps: Array<string> = await prisma.poap.findMany({
    where: {
      userId: req.session.user.id,
      isHidden: true
    },
    select: {
      id: true,
      tokenId: true,
      walletAddress: true
    }
  });

  return res.status(200).json(poaps);
}

export default withSessionRoute(handler);
