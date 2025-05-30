import { cookieName } from '@packages/config/constants';
import { getAppApexDomain } from '@packages/lib/utils/domains/getAppApexDomain';
import { isLocalhostAlias } from '@packages/lib/utils/domains/isLocalhostAlias';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function removeOldCookieFromResponse(req: NextApiRequest, res: NextApiResponse, keepSession?: boolean) {
  if (isLocalhostAlias(req.headers.host)) {
    return;
  }

  const cookiesHeader = res.getHeader('Set-Cookie') || [];
  const setCookiesArray = Array.isArray(cookiesHeader) ? cookiesHeader : [String(cookiesHeader)];

  try {
    res.setHeader('Set-Cookie', [
      ...setCookiesArray,
      // remove old cross-domain cookie
      `${cookieName}=; Domain=${getAppApexDomain()}; Max-Age=0; Path=/; HttpOnly;`
    ]);
  } catch (e) {
    // fails on custom domain spaces
  }

  if (keepSession) {
    await req.session.save();
  }
}
