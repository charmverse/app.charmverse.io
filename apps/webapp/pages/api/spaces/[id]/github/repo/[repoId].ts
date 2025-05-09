import type { RewardsGithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).put(updateGithubRepoWithReward);

export type UpdateGithubRepoWithReward = Partial<
  Pick<
    RewardsGithubRepo,
    'repositoryId' | 'rewardTemplateId' | 'repositoryName' | 'repositoryLabels' | 'rewardAuthorId'
  >
>;

async function updateGithubRepoWithReward(req: NextApiRequest, res: NextApiResponse<RewardsGithubRepo>) {
  const spaceId = req.query.id as string;
  const repoId = req.query.repoId as string;
  const { repositoryId, rewardTemplateId, repositoryName, repositoryLabels, rewardAuthorId } =
    req.body as UpdateGithubRepoWithReward;
  const updatedRewardsGithubRepo = await prisma.rewardsGithubRepo.update({
    where: {
      id: repoId,
      connection: {
        spaceId
      }
    },
    data: {
      repositoryName,
      repositoryLabels,
      rewardAuthorId,
      repositoryId,
      rewardTemplateId
    }
  });

  return res.status(200).json(updatedRewardsGithubRepo);
}

export default withSessionRoute(handler);
