
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { FavoritePage, User } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

export interface LoginResponse extends User {
  favorites: FavoritePage[];
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(createProfile)
  .use(requireUser)
  .get(getProfile);

async function createProfile (req: NextApiRequest, res: NextApiResponse<LoginResponse | { error: any }>) {

  const { address } = req.body;
  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: address
      }
    },
    include: {
      favorites: true
    }
  });

  if (user) {
    req.session.user = user;
    await req.session.save();
    res.status(200).json(user);
  }
  else {
    console.log('Create new user', { address });
    const newUser = await prisma.user.create({
      data: {
        addresses: [address]
      },
      include: {
        favorites: true
      }
    });
    req.session.user = newUser;
    await req.session.save();
    res.status(200).json(newUser);
  }
}

async function getProfile (req: NextApiRequest, res: NextApiResponse<LoginResponse | { error: any }>) {

  const profile = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: {
      favorites: true
    }
  });
  if (!profile) {
    return res.status(404).json({ error: 'No user found' });
  }
  return res.status(200).json(profile);
}

export default withSessionRoute(handler);
