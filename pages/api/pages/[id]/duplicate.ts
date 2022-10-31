import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages/server';
import { duplicatePage } from 'lib/pages/server/duplicatePage';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(duplicatePageRoute);

async function duplicatePageRoute (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;
  const { parentId } = req.body as { parentId: string };

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You are not allowed to edit this page.');
  }

  const pageWithPermissions = await duplicatePage(pageId, userId, parentId);
  updateTrackPageProfile(pageWithPermissions.id);
  trackUserAction('create_page', { userId, spaceId: pageWithPermissions.spaceId, pageId: pageWithPermissions.id, type: pageWithPermissions.type });

  return res.status(200).json(pageWithPermissions);
}

export default withSessionRoute(handler);
