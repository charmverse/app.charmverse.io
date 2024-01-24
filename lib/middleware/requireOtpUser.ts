import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

export function requireOtpUser(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  if (!req.session?.otpUser) {
    res.status(401).send({ error: 'Please go to login page and start again the process of authentication' });
  } else {
    next();
  }
}
