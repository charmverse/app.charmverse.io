import type { Page, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { PageNotFoundError } from '@packages/pages/errors';
import { generatePageLink } from '@packages/pages/generatePageLink';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getPageLink);

async function getPageLink(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      space: true
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

  const pageLink = await generatePageLink(page as Page & { space: Space });

  res.status(200).json(pageLink);
}

export default withSessionRoute(handler);
