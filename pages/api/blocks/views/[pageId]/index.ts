
import type { Block } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { requireUser } from 'lib/middleware/requireUser';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

import { DataNotFoundError } from '../../../../../lib/utilities/errors';

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

  if (!publicPage) {
    throw new DataNotFoundError(`Views for page id ${pageId} not found`);
  }

  const computed = await computeUserPagePermissions({
    pageId: pageId as string,
    userId: req.session?.user?.id
  });

  if (computed.read !== true) {
    throw new DataNotFoundError(`Views for page id ${pageId} not found`);
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
