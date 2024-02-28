import type { NextApiRequest, NextApiResponse } from 'next';

import { cookieName } from 'config/constants';
import { getAppApexDomain } from 'lib/utils/domains/getAppApexDomain';
import { isLocalhostAlias } from 'lib/utils/domains/isLocalhostAlias';

export async function removeOldCookieFromResponse(req: NextApiRequest, res: NextApiResponse, keepSession?: boolean) {
  if (isLocalhostAlias(req.headers.host)) {
    return;
  }

  const cookiesHeader = res.getHeader('Set-Cookie') || [];
  const setCookiesArray = Array.isArray(cookiesHeader) ? cookiesHeader : [String(cookiesHeader)];

  res.setHeader('Set-Cookie', [
    ...setCookiesArray,
    // remove old cross-domain cookie
    `${cookieName}=; Domain=${getAppApexDomain()}; Max-Age=0; Path=/; HttpOnly;`
  ]);

  if (keepSession) {
    await req.session.save();
  }
}
