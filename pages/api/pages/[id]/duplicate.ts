import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { prismaToBlock } from 'lib/focalboard/block';
import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { duplicatePage } from 'lib/pages/duplicatePage';
import type { DuplicatePageResponse, PageMeta } from 'lib/pages/server';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { PageNotFoundError } from 'lib/public-api';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(duplicatePageRoute);

async function duplicatePageRoute(req: NextApiRequest, res: NextApiResponse<DuplicatePageResponse>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const duplicatedPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      parentId: true,
      spaceId: true
    }
  });

  if (!duplicatedPage) {
    throw new PageNotFoundError(pageId);
  }

  const permissions = await computeUserPagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You are not allowed to edit this page.');
  }

  const duplicatePageResponse = await duplicatePage({ pageId, parentId: duplicatedPage.parentId });
  const { pages, rootPageId, blocks } = duplicatePageResponse;
  await Promise.all(pages.map((page) => updateTrackPageProfile(page.id)));

  const pagesMap: Record<string, PageMeta> = {};
  pages.forEach((page) => {
    pagesMap[page.id] = page;
  });

  const page = pagesMap[rootPageId];
  if (page) {
    trackUserAction('duplicate_page', {
      userId,
      spaceId: page.spaceId,
      pageId: page.id,
      type: page.type
    });
  }

  relay.broadcast(
    {
      type: 'pages_created',
      payload: pages
    },
    page.spaceId
  );

  relay.broadcast(
    {
      type: 'blocks_created',
      payload: blocks.map((block) => prismaToBlock(block))
    },
    page.spaceId
  );

  return res.status(200).send(duplicatePageResponse);
}

export default withSessionRoute(handler);
