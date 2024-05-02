import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createOctokitApp } from 'lib/github/app';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
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
  .post(connectGithub);

async function connectGithub(req: NextApiRequest, res: NextApiResponse) {
  const installationId = req.body.installationId;
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  const appOctokit = createOctokitApp(installationId);

  const { data: app } = await appOctokit.request('GET /app');
  const appName = app.name;

  await prisma.$transaction([
    prisma.spaceGithubConnection.deleteMany({
      where: {
        spaceId
      }
    }),
    prisma.spaceGithubConnection.create({
      data: {
        installationId,
        spaceId,
        name: appName,
        createdBy: userId
      }
    })
  ]);

  trackUserAction('github_app_connect', {
    installationId,
    spaceId,
    userId
  });

  log.info('Connected Github application', { installationId, spaceId, userId });

  return res.status(200).end();
}

export default withSessionRoute(handler);
