
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { PageNotFoundError, generatePageLink } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getPageLink);

async function getPageLink (req: NextApiRequest, res: NextApiResponse) {

  const pageId = req.query.id as string;

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id,
    spaceId: page.spaceId as string,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const pageLink = await generatePageLink(pageId);

  res.status(200).json(pageLink);

}

export default withSessionRoute(handler);
