import { log } from '@packages/core/log';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { requireApiAccess } from '@packages/lib/middleware/requireApiAccess';
import { requireApiKey } from '@packages/lib/middleware/requireApiKey';
import type { NextApiRequestWithApiPageKey } from '@packages/lib/middleware/requireApiPageKey';
import { requireApiPageKey } from '@packages/lib/middleware/requireApiPageKey';
import { requireSuperApiKey } from '@packages/lib/middleware/requireSuperApiKey';
import { count } from '@packages/metrics';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch }).use(logApiRequest);
}

export function apiHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })
    .use(requireApiKey)
    .use(requireApiAccess)
    .use(secureSpaceApiRequest)
    .use(logApiRequest);
}

export function apiPageKeyHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch }).use(requireApiPageKey).use(logApiRequest);
}

export function superApiHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })
    .use(requireSuperApiKey)
    .use(securePartnerSpaceApiRequest)
    .use(logApiRequest);
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

function secureSpaceApiRequest(req: NextApiRequest, res: NextApiResponse, next: VoidFunction) {
  if (!req.authorizedSpaceId) {
    throw new ActionNotPermittedError('No authorised space ID found');
  }
  next();
}

function securePartnerSpaceApiRequest(req: NextApiRequest, res: NextApiResponse, next: VoidFunction) {
  const spaceId = (req.query.spaceId ?? req.body.spaceId) as string;

  if (!req.spaceIdRange || !req.spaceIdRange.length || (spaceId && !req.spaceIdRange.includes(spaceId))) {
    throw new ActionNotPermittedError('No matching space ID found for partner API key');
  }
  next();
}
