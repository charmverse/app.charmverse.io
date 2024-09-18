import type { GithubEvent, BuilderEvent, GemsReceipt, GithubUser } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { PullRequest } from './getPullRequests';

export async function processMergedPullRequest(pullRequest: PullRequest) {
  const allUserEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: pullRequest.author.login
    }
  });
}
