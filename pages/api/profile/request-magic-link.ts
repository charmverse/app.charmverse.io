import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createUserFromEmail } from 'lib/users/createUserFromEmail';
import { InvalidInputError } from 'lib/utilities/errors';
import { isValidEmail } from 'lib/utilities/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });
handler.post(requestMagicLinkController);

async function requestMagicLinkController(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    throw new InvalidInputError('Invalid email address');
  }

  // This method is an upsert, so we don't need to check for duplicates
  const user = await createUserFromEmail({ email });

  // console.log('User: ', user);

  res.status(200).json(user);
}

export default withSessionRoute(handler);
