import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { SetForumCategoryNotificationInput } from '@packages/lib/userNotifications/setForumCategoryNotification';
import { setForumCategoryNotification } from '@packages/lib/userNotifications/setForumCategoryNotification';

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
