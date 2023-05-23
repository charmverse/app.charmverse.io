import type { NextApiRequest, NextApiResponse } from 'next';

import { cookieName } from 'config/constants';
import { isLocalhostAlias } from 'lib/utilities/getValidSubdomain';

export async function removeOldCookieFromResponse(req: NextApiRequest, res: NextApiResponse, keepSession?: boolean) {
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

  if (keepSession) {
    await req.session.save();
  }
}
