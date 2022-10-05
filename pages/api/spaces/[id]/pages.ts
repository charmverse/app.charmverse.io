
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getAccessiblePages } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getPages);

async function getPages (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions[]>) {
  const spaceId = req.query.id as string;
  const archived = req.query.archived === 'true';
  const userId = req.session?.user?.id;
  const meta = req.query.meta === 'true';
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const accessiblePages = await getAccessiblePages({
    spaceId,
    userId,
    archived,
    meta,
    search
  });

  return res.status(200).json(accessiblePages);
}

export default withSessionRoute(handler);
