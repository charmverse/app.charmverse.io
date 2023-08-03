import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { count } from 'lib/metrics';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch } from 'lib/middleware';
import { requireApiKey } from 'lib/middleware/requireApiKey';
import type { NextApiRequestWithApiPageKey } from 'lib/middleware/requireApiPageKey';
import { requireApiPageKey } from 'lib/middleware/requireApiPageKey';
import { requireSuperApiKey } from 'lib/middleware/requireSuperApiKey';

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch }).use(logApiRequest);
}

export function apiHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch }).use(requireApiKey).use(logApiRequest);
}

export function apiPageKeyHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch }).use(requireApiPageKey).use(logApiRequest);
}

export function superApiHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch }).use(requireSuperApiKey).use(logApiRequest);
}
export async function logApiRequest(req: NextApiRequestWithApiPageKey, res: NextApiResponse, next: VoidFunction) {
  // Get a sanitised url to avoid leaking keys
  let path = req.url?.split('?')[0] ?? '';

  log.debug(`[public-api] Request: ${req.method} ${req.url}`, {
    query: req.query,
    body: req.body,
    spaceId: req.authorizedSpaceId,
    superApiTokenName: req.superApiToken?.name,
    path
  });
  const pageId = (req.query.cardId ?? req.query.pageIdOrPath ?? req.query.id) as string;

  const apiPageKey = req.query.apiPageKey as string;

  if (apiPageKey) {
    path = path.replace(apiPageKey, '{apiPageKey}');
  }

  if (pageId) {
    path = path.replace(pageId, '{pageId}');
  }

  // Support partnerApiKeys, spaceApiKeys, and pageApiKeys
  trackUserAction(req.superApiToken ? 'partner_api_call' : 'space_api_call', {
    method: req.method as string,
    spaceId: req.apiPageKey?.page?.spaceId ?? req.authorizedSpaceId,
    endpoint: path,
    partnerKey: req.superApiToken ? req.superApiToken.name : '',
    userId: (req.botUser?.id as string) ?? '',
    pageId: req.apiPageKey?.pageId ?? pageId ?? ''
  });

  count(`public-api.${path}.${req.method?.toLowerCase()}`, 1);

  next();
}
