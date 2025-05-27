import { InvalidInputError } from '@charmverse/core/errors';
import { isTestEnv } from '@packages/config/constants';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { LoggedInUser } from '@packages/profile/getUser';
import { getUserProfile } from '@packages/profile/getUser';
import { createOrGetUserFromWallet } from '@packages/users/createUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

if (isTestEnv) {
  handler.post(register);
}

async function register(req: NextApiRequest, res: NextApiResponse) {
  const { address, userId } = req.body;
  let user: LoggedInUser;

  try {
    user = await (userId ? getUserProfile('id', userId) : getUserProfile('addresses', address));
  } catch {
    if (!address) {
      throw new InvalidInputError(
        userId ? `User with id "${userId}" not found` : `Please provide a user wallet to create this account`
      );
    }
    const { user: createdUser } = await createOrGetUserFromWallet({ address });
    user = createdUser;
    user.isNew = true;
  }

  req.session.user = user;
  await req.session.save();

  res.status(200).json(user);
}

export default withSessionRoute(handler);
