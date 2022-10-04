
import type { UserDetails } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(createUserDetails)
  .use(requireUser)
  .get(getUserDetails)
  .put(updateUserDetails);

export async function createUserDetails (req: NextApiRequest, res: NextApiResponse<UserDetails | { error: any }>) {
  const details: UserDetails = await prisma.userDetails.create({
    data: {
      id: req.session.user.id
    }
  });

  res.status(200).json(details);
}

async function getUserDetails (req: NextApiRequest, res: NextApiResponse<UserDetails | { error: any }>) {
  const details = await prisma.userDetails.findUnique({
    where: {
      id: req.session.user.id
    }
  });

  if (!details) {
    return res.status(202).end();
  }
  return res.status(200).json(details);
}

async function updateUserDetails (req: NextApiRequest, res: NextApiResponse<UserDetails | { error: string }>) {
  const details = await prisma.userDetails.upsert({
    where: {
      id: req.session.user.id
    },
    create: {
      id: req.session.user.id,
      ...req.body
    },
    update: {
      ...req.body
    }
  });

  return res.status(200).json(details);
}

export default withSessionRoute(handler);
