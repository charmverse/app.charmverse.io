import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getStripePublicKey);

async function getStripePublicKey(req: NextApiRequest, res: NextApiResponse<{ publicKey: string }>) {
  res.status(200).json({
    publicKey: process.env.STRIPE_PUBLIC_KEY as string
  });
}

export default withSessionRoute(handler);
