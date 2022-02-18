
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPage);

async function createPage (req: NextApiRequest, res: NextApiResponse<Page>) {
  const data = req.body as Prisma.PageCreateInput;
  const page = await prisma.page.create({ data });
  return res.status(200).json(page);
}

export default withSessionRoute(handler);
