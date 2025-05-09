import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createOctokitApp } from '@packages/lib/github/app';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

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

  const appOctokit = createOctokitApp(installationId);

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
