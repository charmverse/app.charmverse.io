import { NextApiRequest, NextApiResponse } from 'next';

export function requireUser (req: NextApiRequest, res: NextApiResponse, next: Function) {
  if (!req.session.user) {
    res.status(401).send({ error: 'Please log in' });
  }
  else {
    next();
  }
}
