import type { LoggedInUser } from '@packages/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { EmailAccountDisconnect } from '@packages/lib/google/disconnectVerifiedEmail';
import { disconnectVerifiedEmail } from '@packages/lib/google/disconnectVerifiedEmail';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(disconnectEmailAccount);

async function disconnectEmailAccount(req: NextApiRequest, res: NextApiResponse<LoggedInUser>) {
  const userId = req.session.user.id;

  const { email } = req.body as EmailAccountDisconnect;

  const updatedUser = await disconnectVerifiedEmail({
    email,
    userId
  });

  res.status(200).send(updatedUser);
}

export default withSessionRoute(handler);
