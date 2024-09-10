import type { LoggedInUser } from '@root/lib/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { updateProfileAvatar } from 'lib/profile/updateProfileAvatar';
import { withSessionRoute } from 'lib/session/withSession';
import type { UserAvatar } from 'lib/users/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateAvatar);

async function updateAvatar(req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {
  const { avatar, avatarTokenId, avatarContract, avatarChain } = req.body as UserAvatar;
  const userId = req.session.user.id;

  const user = await updateProfileAvatar({ avatar, avatarTokenId, avatarContract, avatarChain, userId });

  res.status(200).json(user);
}

export default withSessionRoute(handler);
