import type { Page, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { generatePageLink, PageNotFoundError } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';

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
