import type { NextApiRequest, NextApiResponse } from 'next';

import { cookieName } from 'config/constants';
import { isLocalhostAlias } from 'lib/utilities/getValidSubdomain';

export function removeOldCookieFromResponse(req: NextApiRequest, res: NextApiResponse) {
  if (isLocalhostAlias(req.headers.host)) {
    return;
  }

  const cookiesHeader = res.getHeader('Set-Cookie') || [];
  const setCookiesArray = Array.isArray(cookiesHeader) ? cookiesHeader : [String(cookiesHeader)];

  res.setHeader('Set-Cookie', [
    ...setCookiesArray,
    // remove old non cross-domain cookie
    `${cookieName}=; Max-Age=0; Path=/; HttpOnly;`
  ]);
}
