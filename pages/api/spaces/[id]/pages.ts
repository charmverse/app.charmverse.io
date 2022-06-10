
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import {} from 'lib/permissions/pages';
import { getAccessiblePages } from 'lib/pages/server';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getPages);

async function getPages (req: NextApiRequest, res: NextApiResponse<Page[]>) {
  const spaceId = req.query.id as string;
  const userId = req.session?.user?.id;

  const accessiblePages = await getAccessiblePages({
    spaceId,
    userId
  });

  return res.status(200).json(accessiblePages);
}

export default withSessionRoute(handler);
