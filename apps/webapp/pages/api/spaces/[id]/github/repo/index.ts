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

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).post(connectGithubRepoWithReward);

export type ConnectRewardGithubRepoPayload = Pick<
  RewardsGithubRepo,
  'repositoryId' | 'rewardTemplateId' | 'repositoryName' | 'repositoryLabels' | 'rewardAuthorId'
>;

async function connectGithubRepoWithReward(req: NextApiRequest, res: NextApiResponse<RewardsGithubRepo>) {
  const spaceId = req.query.id as string;
  const { repositoryId, rewardTemplateId, repositoryName, repositoryLabels, rewardAuthorId } =
    req.body as ConnectRewardGithubRepoPayload;

  const spaceGithubConnection = await prisma.spaceGithubConnection.findFirstOrThrow({
    where: {
      spaceId
    },
    select: {
      id: true,
      name: true,
      installationId: true
    }
  });

  const rewardsGithubRepo = await prisma.rewardsGithubRepo.create({
    data: {
      repositoryId,
      repositoryName,
      rewardTemplateId,
      rewardAuthorId,
      repositoryLabels,
      connectionId: spaceGithubConnection.id
    }
  });

  return res.status(200).json(rewardsGithubRepo);
}

export default withSessionRoute(handler);
