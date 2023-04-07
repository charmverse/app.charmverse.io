import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { CreateSpaceProps } from 'lib/spaces/createSpace';
import { createWorkspace } from 'lib/spaces/createSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaces).post(createSpace);

async function getSpaces(req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const userId = req.session.user.id;

  const sortOrder = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      spacesOrder: true
    }
  });

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      space: true
    }
  });

  const spaces = spaceRoles.map((sr) => sr.space);

  // There are cases where we join/create/delete a space and the spacesOrder is not updated. With this we make sure that the spacesOrder is always up to date.
  const getSpacesOrder = () => {
    if (sortOrder?.spacesOrder && sortOrder.spacesOrder.length === spaces.length) {
      return sortOrder.spacesOrder;
    }

    if (sortOrder?.spacesOrder && sortOrder.spacesOrder.length !== spaces.length) {
      const notIncludedSpaceIds = spaces.filter((sp) => !sortOrder.spacesOrder.includes(sp.id)).map((sp) => sp.id);
      return [...sortOrder.spacesOrder, ...notIncludedSpaceIds];
    }

    return spaceRoles.map((sr) => sr.space.id);
  };

  const spacesOrder = getSpacesOrder();
  const sortedSpaces = spaces.sort((a, b) => spacesOrder.indexOf(a.id) - spacesOrder.indexOf(b.id));

  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json(sortedSpaces);
}

async function createSpace(req: NextApiRequest, res: NextApiResponse<Space>) {
  const userId = req.session.user.id;
  const data = req.body as CreateSpaceProps;

  const space = await createWorkspace({
    spaceData: data.spaceData,
    createSpaceTemplate: data.createSpaceTemplate,
    userId
  });

  return res.status(200).json(space);
}

export default withSessionRoute(handler);
