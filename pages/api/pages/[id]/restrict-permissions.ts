import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages';
import { computeUserPagePermissions, lockToBountyCreator } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(restrictPermissions);

async function restrictPermissions (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const pageId = req.query.id as string;

  const computed = await computeUserPagePermissions({
    pageId,
    userId: req.session?.user?.id
  });

  if (computed.edit_content !== true) {
    throw new UnauthorisedActionError('You do not have permission to restrict permissions on this page');
  }

  const updatedPage = await lockToBountyCreator({ pageId });

  return res.status(200).json(updatedPage);
}

export default withSessionRoute(handler);
