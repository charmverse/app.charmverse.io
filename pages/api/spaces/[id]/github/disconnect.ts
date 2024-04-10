import { prisma } from '@charmverse/core/prisma-client';
import { createAppAuth } from '@octokit/auth-app';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Octokit } from 'octokit';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .delete(disconnectGithub);

async function disconnectGithub(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;

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
