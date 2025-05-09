import type { LoggedInUser } from '@packages/profile/getUser';
import { updateProfileAvatar } from '@packages/profile/updateProfileAvatar';
import type { UserAvatar } from '@packages/users/interfaces';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateAvatar);

async function updateAvatar(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {
  const { avatar, avatarTokenId, avatarContract, avatarChain } = req.body as UserAvatar;
  const userId = req.session.user.id;

  const user = await updateProfileAvatar({ avatar, avatarTokenId, avatarContract, avatarChain, userId });

  res.status(200).json(user);
}

export default withSessionRoute(handler);
