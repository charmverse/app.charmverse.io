import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { SetForumCategoryNotificationInput } from 'lib/userNotifications/setForumCategoryNotification';
import { setForumCategoryNotification } from 'lib/userNotifications/setForumCategoryNotification';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(setCategoryNotification);

async function setCategoryNotification(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.body as SetForumCategoryNotificationInput;

  if (typeof spaceId !== 'string') {
    throw new InvalidInputError('spaceId must be a string');
  }

  const result = await setForumCategoryNotification({
    spaceId,
    userId: req.session.user.id,
    categoryId: req.body.categoryId,
    enabled: req.body.enabled
  });

  res.status(200).json(result);
}

export default withSessionRoute(handler);
