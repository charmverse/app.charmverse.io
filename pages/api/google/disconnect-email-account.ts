import type { LoggedInUser } from '@packages/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { EmailAccountDisconnect } from 'lib/google/disconnectVerifiedEmail';
import { disconnectVerifiedEmail } from 'lib/google/disconnectVerifiedEmail';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

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
