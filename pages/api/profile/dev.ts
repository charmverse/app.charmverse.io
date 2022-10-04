import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createUserFromWallet } from 'lib/users/createUser';
import { getUserProfile } from 'lib/users/getUser';
import type { LoggedInUser } from 'models';

const isTestEnv = process.env.APP_ENV === 'test';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

if (isTestEnv) {
  handler
    .post(register);
}

async function register (req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.body;

  let user: LoggedInUser;

  try {
    user = await getUserProfile('addresses', address);
  }
  catch {
    user = await createUserFromWallet(address);
    user.isNew = true;
  }

  req.session.user = user;
  await req.session.save();

  res.status(200).json(user);
}

export default withSessionRoute(handler);
