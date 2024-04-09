import type { RewardsGithubRepo } from '@charmverse/core/prisma-client';
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

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getGithubApplicationData);

export type GithubApplicationData = {
  repositories: {
    name: string;
    url: string;
    id: number;
  }[];
  spaceGithubCredential: {
    name: string;
    installationId: string;
    rewardsRepo: RewardsGithubRepo | null;
  };
};

async function getGithubApplicationData(req: NextApiRequest, res: NextApiResponse<GithubApplicationData | null>) {
  const spaceId = req.query.id as string;
  const spaceGithubCredential = await prisma.spaceGithubCredential.findFirstOrThrow({
    where: {
      spaceId
    },
    select: {
      name: true,
      installationId: true,
      rewardsRepos: true
    }
  });

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: Number(process.env.GITHUB_APP_ID),
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      installationId: spaceGithubCredential.installationId
    }
  });

  let page = 1;
  const perPage = 30;
  let repositories: GithubApplicationData['repositories'] = [];
  let hasMore = true;

  while (hasMore) {
    const { data: repos } = await appOctokit.request('GET /installation/repositories', {
      page,
      per_page: perPage
    });

    repositories = [...repositories, ...repos.repositories.map(({ name, id, url }) => ({ name, url, id }))];

    if (repos.repositories.length < perPage) {
      hasMore = false;
    } else {
      page += 1;
    }
  }

  return res.status(200).json({
    repositories,
    spaceGithubCredential: {
      ...spaceGithubCredential,
      rewardsRepo: spaceGithubCredential.rewardsRepos[0] ?? null
    }
  });
}

export default withSessionRoute(handler);
