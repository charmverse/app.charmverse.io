
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { User } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

export interface LoginResponse extends User {}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(authenticate);

async function authenticate (req: NextApiRequest, res: NextApiResponse<LoginResponse | { error: any }>) {
  const { address } = req.body;
  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: address
      }
    }
  });

  if (!user) {
    return res.status(401).send({ error: 'No user has been associated with this wallet address' });
  }

  req.session.user = user;
  await req.session.save();

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
