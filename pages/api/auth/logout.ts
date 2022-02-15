
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { User } from '@prisma/client';
import { onError, onNoMatch, withSessionRoute } from 'lib/middleware';

export interface LoginResponse extends User {}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(logout);

async function logout (req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  req.session.destroy();
  res.send({ ok: true });
}

export default withSessionRoute(handler);
