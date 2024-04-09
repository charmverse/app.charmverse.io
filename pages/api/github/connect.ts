import { log } from '@charmverse/core/log';
import { createOAuthAppAuth } from '@octokit/auth-oauth-app';
import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { INSTALLATION_ID_COOKIE } from 'lib/github/constants';
import { onError, onNoMatch } from 'lib/middleware';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(connectGithub);

// https://github.com/apps/dev-charmverse-integration/installations/new?state=%7B%22spaceId%22%3A%22d59149ab-0515-4096-8c59-ebc1c3ad04c0%22%7D

const auth = createOAuthAppAuth({
  clientType: 'github-app',
  clientId: process.env.GITHUB_APP_CLIENT_ID!,
  clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!
});

async function connectGithub(req: NextApiRequest, res: NextApiResponse) {
  const installationId = req.query.installation_id as string;
  let redirect: string;

  try {
    const state = req.query.state ? JSON.parse(decodeURIComponent(req.query.state as string)) : {};
    redirect = state.redirect;
  } catch (e) {
    log.warn('Error parsing github state callback', e);
    // TODO: Error page
    res.status(400).send('Invalid callback state');
    return;
  }

  try {
    // Check if the code is valid
    await auth({
      type: 'oauth-user',
      code: req.query.code as string
    });

    const cookies = new Cookies(req, res);
    cookies.set(INSTALLATION_ID_COOKIE, installationId, {
      httpOnly: false,
      sameSite: 'strict'
    });
  } catch (err) {
    log.error('Failed to connect Github', {
      installationId,
      error: err
    });
  }

  return res.redirect(redirect);
}

export default handler;
