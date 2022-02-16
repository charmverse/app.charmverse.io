
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Space } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaces).post(createSpace);

async function getSpaces (req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const spaces = await prisma.space.findMany({ where: { createdBy: req.session.user.id } });
  return res.status(200).json(spaces);
}

async function createSpace (req: NextApiRequest, res: NextApiResponse<Space>) {
  const data = req.body as Prisma.SpaceCreateInput;
  const space = await prisma.space.create({ data });
  return res.status(200).json(space);
}

export default withSessionRoute(handler);
