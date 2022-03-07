
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requireUser } from 'lib/middleware/requireUser';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBlockPageViews);

async function getBlockPageViews (req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const { pageId } = req.query;
  const publicPage = await prisma.page.findFirst({
    where: {
      id: pageId as string,
      type: 'board'
    }
  });
  if (!publicPage || !publicPage.isPublic || !publicPage.boardId) {
    return res.status(404).json({ error: 'views not found' });
  }
  const blocks = await prisma.block.findMany({
    where: {
      type: 'view',
      rootId: publicPage.boardId!
    }
  });
  return res.status(200).json(blocks);
}

export default withSessionRoute(handler);
