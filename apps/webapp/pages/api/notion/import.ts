import * as http from '@charmverse/core/http';
import { log } from '@charmverse/core/log';
import { isTestEnv } from '@packages/config/constants';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { MissingDataError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { importFromWorkspace } from 'lib/notion/importFromWorkspace';
import type { FailedImportsError } from 'lib/notion/interfaces';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'spaceId' })).post(importNotion);

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

async function importNotion(
  req: NextApiRequest,
  res: NextApiResponse<
    | {
        failedImports: FailedImportsError[];
      }
    | { error: string }
  >
) {
  const spaceId = req.body.spaceId as string;
  const tempAuthCode = req.body.code;

  if (!spaceId || !tempAuthCode) {
    throw new MissingDataError('Invalid code or space');
  }

  if (isTestEnv) {
    res.status(200).json({ failedImports: [] });
    return;
  }

  const encodedToken = Buffer.from(`${process.env.NOTION_OAUTH_CLIENT_ID}:${process.env.NOTION_OAUTH_SECRET}`).toString(
    'base64'
  );

  try {
    const proto = req.headers['x-forwarded-proto'] || (req.connection as any)?.encrypted ? 'https' : 'http';

    const token = await http.POST<NotionApiResponse>(
      'https://api.notion.com/v1/oauth/token',
      {
        grant_type: 'authorization_code',
        redirect_uri: `${proto}://${req.headers.host}/api/notion/callback`,
        code: tempAuthCode
      },
      {
        headers: {
          Authorization: `Basic ${encodedToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    log.info('[notion] - Importing from notion', { spaceId, token, userId: req.session.user.id });
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
  } catch (err: any) {
    log.warn('Error importing from notion', { userId: req.session.user.id, error: err, spaceId });

    if (err.error === 'invalid_grant' || err.error === 'invalid_request') {
      res.status(400).json({ error: 'Invalid code. Please try importing again' });
    } else {
      res.status(400).json({ error: 'Something went wrong!' });
    }
  }
}

export default withSessionRoute(handler);
