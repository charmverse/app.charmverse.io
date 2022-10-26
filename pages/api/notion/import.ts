import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import * as http from 'adapters/http';
import { isTestEnv } from 'config/constants';
import log from 'lib/log';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { importFromWorkspace } from 'lib/notion/importFromWorkspace';
import type { FailedImportsError } from 'lib/notion/types';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, MissingDataError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc({
  onError,
  onNoMatch
});

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'spaceId' }))
  .post(importNotion);

interface NotionApiResponse {
  workspace_name: string;
  workspace_icon: string;
  access_token: string;
  owner: {
    user: {
      id: string;
      person: {
        email: string;
      };
    };
  };
}

async function importNotion (req: NextApiRequest, res: NextApiResponse<{
  failedImports: FailedImportsError[];
} | { error: string }>) {

  const spaceId = req.body.spaceId as string;
  const tempAuthCode = req.body.code;

  if (!spaceId || !tempAuthCode) {
    throw new MissingDataError('Invalid code or space');
  }

  if (isTestEnv) {
    res.status(200).json({ failedImports: [] });
    return;
  }

  const encodedToken = Buffer.from(`${process.env.NOTION_OAUTH_CLIENT_ID}:${process.env.NOTION_OAUTH_SECRET}`).toString('base64');

  try {
    const proto = (req.headers['x-forwarded-proto'] || (req.connection as any)?.encrypted) ? 'https' : 'http';

    const token = await http.POST<NotionApiResponse>('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      redirect_uri: `${proto}://${req.headers.host}/api/notion/callback`,
      code: tempAuthCode
    }, {
      headers: {
        Authorization: `Basic ${encodedToken}`,
        'Content-Type': 'application/json'
      }
    });
    const failedImports = await importFromWorkspace({
      spaceId,
      userId: req.session.user.id,
      accessToken: token.access_token,
      workspaceName: token.workspace_name,
      workspaceIcon: token.workspace_icon
    });

    res.status(200).json({
      failedImports
    });

  }
  catch (err: any) {
    log.warn('Error importing from notion', err);

    if (err.error === 'invalid_grant' || err.error === 'invalid_request') {
      res.status(400).json({ error: 'Invalid code. Please try importing again' });
    }
    else {
      res.status(400).json({ error: 'Something went wrong!' });
    }
  }
}

export default withSessionRoute(handler);
