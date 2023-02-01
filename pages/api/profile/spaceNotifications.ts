import type { UserSpaceNotificationSettings } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getSettings, updateSettings } from 'lib/profile/spaceNotificationSettings';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getNotifications).put(updateNotifications);

async function getNotifications(req: NextApiRequest, res: NextApiResponse<any | { error: string }>) {
  const { spaceId } = req.query;

  if (typeof spaceId !== 'string') {
    throw new InvalidInputError('spaceId must be a string');
  }

  const notifications = await getSettings({
    spaceId,
    userId: req.session.user.id
  });

  res.status(200).json(notifications);
}

async function updateNotifications(req: NextApiRequest, res: NextApiResponse<any | { error: string }>) {
  const { spaceId } = req.body;

  if (typeof spaceId !== 'string') {
    throw new InvalidInputError('spaceId must be a string');
  }

  const notifications = await updateSettings({
    spaceId,
    userId: req.session.user.id,
    forumCategoriesMode: req.body.forumCategoriesMode,
    forumCategories: req.body.forumCategories
  });

  res.status(200).json(notifications);
}
