import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import log from 'lib/log';
import { count } from 'lib/metrics';
import { onError, onNoMatch } from 'lib/middleware';
import { requireApiKey } from 'lib/middleware/requireApiKey';

export function apiHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch }).use(requireApiKey).use(logApiRequest);
}

async function logApiRequest(req: NextApiRequest, res: NextApiResponse, next: VoidFunction) {
  const path = req.url?.split('?')[0];

  log.debug(`[public-api] Request: ${req.method} ${req.url}`, {
    query: req.query,
    body: req.body,
    path
  });

  count(`public-api.${path}.${req.method?.toLowerCase()}`, 1);

  next();
}
