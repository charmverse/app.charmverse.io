
import { onError, onNoMatch } from 'lib/middleware';
import { getAccessiblePages, IPageWithPermissions } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getPages);

async function getPages (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions[]>) {
  const spaceId = req.query.id as string;
  const archived = req.query.archived as string === 'true';
  const userId = req.session?.user?.id;

  const accessiblePages = await getAccessiblePages({
    spaceId,
    userId,
    archived
  });

  return res.status(200).json(accessiblePages);
}

export default withSessionRoute(handler);
