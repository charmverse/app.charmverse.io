
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Space } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { gettingStartedPageContent } from 'seedData';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaces).post(createSpace);

async function getSpaces (req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId: req.session.user.id
    },
    include: {
      space: true
    }
  });
  const spaces = spaceRoles.map(sr => sr.space);
  return res.status(200).json(spaces);
}

async function createSpace (req: NextApiRequest, res: NextApiResponse<Space>) {
  const data = req.body as Prisma.SpaceCreateInput;
  // add a first page to the space
  data.pages = {
    create: [{
      author: data.author,
      content: gettingStartedPageContent(),
      contentText: '',
      isPublic: false,
      path: 'getting-started',
      title: 'Getting Started',
      type: 'page',
      updatedAt: new Date(),
      updatedBy: data.author.connect!.id!
    }]
  };
  const space = await prisma.space.create({ data });
  return res.status(200).json(space);
}

export default withSessionRoute(handler);
