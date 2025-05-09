import type { IncomingMessage } from 'http';

import { log } from '@charmverse/core/log';

// Given space configuration, request, and page path, return the canonical URL
export function getCanonicalURL({
  req,
  spaceDomain,
  spaceCustomDomain,
  path
}: {
  req: IncomingMessage;
  spaceDomain: string;
  spaceCustomDomain: string | null;
  path: string;
}) {
  const { protocol, host } = absoluteUrl(req);
  const origin = spaceCustomDomain ? `${protocol}//${spaceCustomDomain}` : `${protocol}//${host}`;
  const finalPath = spaceCustomDomain ? path : `${spaceDomain}/${path}`;

  return `${origin}/${finalPath}`;
}

// source: https://www.npmjs.com/package/next-absolute-url
function absoluteUrl(req: IncomingMessage) {
  let protocol = 'https:';
  const host = req
    ? req.headers['x-forwarded-host'] || req.headers.host || ''
    : typeof window !== 'undefined'
      ? window.location.host
      : '';
  if (!host) {
    log.error('Host is not set');
  }
  if (host.indexOf('localhost') > -1) {
    protocol = 'http:';
  }

  return {
    protocol,
    host,
    origin: `${protocol}//${host}`
  };
}
