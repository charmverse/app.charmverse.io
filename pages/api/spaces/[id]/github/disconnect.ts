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

handler.use(requireUser).delete(disconnectGithub);

async function disconnectGithub(req: NextApiRequest, res: NextApiResponse) {
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

  const { installationId, id } = await prisma.spaceGithubConnection.findFirstOrThrow({
    where: {
      spaceId
    },
    select: {
      id: true,
      installationId: true
    }
  });

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: Number(process.env.GITHUB_APP_ID),
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      installationId
    }
  });

  await appOctokit.request('DELETE /app/installations/{installation_id}', {
    installation_id: Number(installationId)
  });

  await prisma.spaceGithubConnection.delete({
    where: {
      id
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
