
import type { UserGnosisSafe } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(listSafes)
  .post(setSafes);

async function listSafes (req: NextApiRequest, res: NextApiResponse<UserGnosisSafe[]>) {

  const wallets = await prisma.userGnosisSafe.findMany({
    where: {
      userId: req.session.user.id
    }
  });
  return res.status(200).json(wallets);
}

async function setSafes (req: NextApiRequest, res: NextApiResponse<UserGnosisSafe>) {

  const walletsInput = req.body as (Pick<UserGnosisSafe, 'address' | 'chainId' | 'name' | 'threshold' | 'owners'>)[];

  const walletsData = walletsInput.map(wallet => ({
    ...wallet,
    userId: req.session.user.id
  }));

  await prisma.$transaction([
    prisma.userGnosisSafe.deleteMany({
      where: {
        userId: req.session.user.id
      }
    }),
    prisma.userGnosisSafe.createMany({
      data: walletsData
    })
  ]);

  return res.status(200).end();
}

export default withSessionRoute(handler);
