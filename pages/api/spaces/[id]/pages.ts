
import { onError, onNoMatch } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getAccessiblePages } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getPages);

async function getPages (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions[]>) {
  const spaceId = req.query.id as string;
  const archived = req.query.archived as string === 'true';
  const userId = req.session?.user?.id;
  const meta = req.query.meta as string === 'true';

  const accessiblePages = await getAccessiblePages({
    spaceId,
    userId,
    archived,
    meta
  });

  return res.status(200).json(accessiblePages);
}

export default withSessionRoute(handler);
