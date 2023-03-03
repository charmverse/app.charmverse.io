import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { duplicatePage } from 'lib/pages/duplicatePage';
import type { DuplicatePageResponse, PageMeta } from 'lib/pages/server';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(duplicatePageRoute);

async function duplicatePageRoute(req: NextApiRequest, res: NextApiResponse<DuplicatePageResponse>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;
  const { parentId } = req.body as { parentId: string | undefined | null };

  const permissions = await computeUserPagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You are not allowed to edit this page.');
  }

  const duplicatePageResponse = await duplicatePage({ pageId, parentId });
  const { pages, rootPageIds } = duplicatePageResponse;
  await Promise.all(pages.map((page) => updateTrackPageProfile(page.id)));

  const pagesMap: Record<string, PageMeta> = {};
  Object.entries(pages).forEach(([_pageId, page]) => {
    pagesMap[_pageId] = page;
  });

  const rootPageId = rootPageIds[0];
  const page = pagesMap[rootPageId];
  if (page) {
    trackUserAction('duplicate_page', {
      userId,
      spaceId: page.spaceId,
      pageId: page.id,
      type: page.type
    });
  }

  return res.status(200).send(duplicatePageResponse);
}

export default withSessionRoute(handler);
