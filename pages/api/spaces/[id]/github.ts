import { prisma } from '@charmverse/core/prisma-client';
import { createAppAuth } from '@octokit/auth-app';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Octokit } from 'octokit';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).post(connectGithub);

async function connectGithub(req: NextApiRequest, res: NextApiResponse) {
  const installationId = req.body.installationId;
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  const { error } = await hasAccessToSpace({
    adminOnly: true,
    spaceId,
    userId
  });

  if (error) {
    throw error;
  }

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: Number(process.env.GITHUB_APP_ID),
      // Replace newlines with actual newlines
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      installationId
    }
  });

  const { data: app } = await appOctokit.request('GET /app');
  const appName = app.name;

  await prisma.spaceGithubCredential.create({
    data: {
      installationId,
      spaceId,
      name: appName,
      createdBy: userId,
      updatedBy: userId
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
