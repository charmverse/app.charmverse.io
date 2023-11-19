import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

export function requireUser(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  if (!req.session?.user) {
    res.status(401).send({ error: 'Please log in' });
  } else {
    next();
  }
}
