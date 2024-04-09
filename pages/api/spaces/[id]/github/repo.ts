import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).post(connectGithubRepo);

export type ConnectGithubRepoPayload = {
  rewardTemplateId: string;
  repositoryId: string;
  repositoryName: string;
};

async function connectGithubRepo(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;
  const { repositoryId, rewardTemplateId, repositoryName } = req.body as ConnectGithubRepoPayload;

  const spaceGithubCredential = await prisma.spaceGithubCredential.findFirstOrThrow({
    where: {
      spaceId
    },
    select: {
      id: true,
      name: true,
      installationId: true
    }
  });

  await prisma.rewardsGithubRepo.upsert({
    create: {
      repositoryId,
      repositoryName,
      rewardTemplateId,
      credentialId: spaceGithubCredential.id,
      rewardAuthorId: userId
    },
    update: {
      repositoryName,
      rewardTemplateId,
      rewardAuthorId: userId
    },
    where: {
      credentialId_repositoryId: {
        credentialId: spaceGithubCredential.id,
        repositoryId
      }
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
