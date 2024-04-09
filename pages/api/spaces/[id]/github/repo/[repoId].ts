import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).put(updateGithubRepoWithReward);

export type UpdateGithubRepoWithReward = Partial<{
  rewardTemplateId: string;
  repositoryId: string;
  repositoryName: string;
}>;

async function updateGithubRepoWithReward(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const repoId = req.query.repoId as string;
  const { repositoryId, rewardTemplateId, repositoryName } = req.body as UpdateGithubRepoWithReward;
  await prisma.rewardsGithubRepo.updateMany({
    where: {
      id: repoId,
      credential: {
        spaceId
      }
    },
    data: {
      repositoryName,
      repositoryId,
      rewardTemplateId
    }
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
