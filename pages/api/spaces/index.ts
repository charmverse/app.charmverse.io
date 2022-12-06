import type { Prisma, Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createWorkspace } from 'lib/spaces/createWorkspace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaces).post(createSpace);

async function getSpaces(req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const userId = req.session.user.id;

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    include: {
      space: true
    }
  });
  const spaces = spaceRoles.map((sr) => sr.space);
  return res.status(200).json(spaces);
}

async function createSpace(req: NextApiRequest, res: NextApiResponse<Space>) {
  const userId = req.session.user.id;
  const data = req.body as Prisma.SpaceCreateInput;

  const space = await createWorkspace({ spaceData: data, userId });

  return res.status(200).json(space);
}

export default withSessionRoute(handler);
