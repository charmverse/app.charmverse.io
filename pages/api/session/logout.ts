import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { cookieName } from 'config/constants';
import { onError, onNoMatch } from 'lib/middleware';
import { getCookieDomain } from 'lib/session/getCookieDomain';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(logout);

async function logout(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  req.session.destroy();
  const cookieDomain = getCookieDomain();

  if (cookieDomain) {
    const cookiesHeader = res.getHeader('Set-Cookie') || [];
    const setCookiesArray = Array.isArray(cookiesHeader) ? cookiesHeader : [];
    const secureCookie = req.headers.host?.startsWith('https://') ? 'Secure;' : '';

    res.setHeader('Set-Cookie', [
      ...setCookiesArray,
      // remove old domain cookies
      `${cookieName}=; Max-Age=0; Domain=app.${getCookieDomain()}; Path=/; HttpOnly; SameSite=Strict ${secureCookie}`
    ]);
  }

  res.send({ ok: true });
}

export default withSessionRoute(handler);
