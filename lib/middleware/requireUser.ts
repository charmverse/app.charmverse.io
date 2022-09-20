import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

export function requireUser (req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  if (!req.session?.user) {
    res.status(401).send({ error: 'Please log in' });
  }
  else {
    next();
  }
}

/**
 * Allow an endpoint to be consumed if it originates from a share page
 */
export function requireUserOrSharePage (req: NextApiRequest, res: NextApiResponse, next: NextHandler) {

  const referer = req.headers.referer as string;

  const url = new URL(referer);
  url.hash = '';
  url.search = '';
  const pathnameParts = referer ? url.pathname.split('/') : [];
  const spaceDomain = pathnameParts[1];

  if (spaceDomain === 'share') {
    next();
  }
  else if (!req.session.user) {
    res.status(401).send({ error: 'Please log in' });
  }
  else {
    next();
  }
}
