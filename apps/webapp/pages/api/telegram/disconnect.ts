import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@packages/profile/getUser';
import { getUserProfile } from '@packages/profile/getUser';
import { updateUsedIdentity } from '@packages/users/updateUsedIdentity';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(disconnectTelegram);

async function disconnectTelegram(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const userId = req.session.user.id;

  const user = await getUserProfile('id', userId);

  if (user.telegramUser) {
    await prisma.telegramUser.delete({
      where: {
        userId: req.session.user.id
      }
    });
  }
  // If identity type is not Telegram we don't need to fallback to another identity
  if (user.identityType !== 'Telegram') {
    const { telegramUser, ...withoutTelegramUser } = user;
    return res.status(200).json(withoutTelegramUser);
  }

  const updatedUser = await updateUsedIdentity(user.id);
  return res.status(200).json(updatedUser);
}

export default withSessionRoute(handler);
