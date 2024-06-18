import { getMergedPullRequests } from './getMergedPullRequests';
import type { GithubGraphQLQuery, GithubUserName } from './getMergedPullRequests';
import type { PullRequestMeta } from './getPullRequestMeta';

export type PullRequestsByRepo = {
  repoName: string;
  repoOwner: string;
  pullRequests: PullRequestMeta[];
};

function groupAndSortPullRequestsByRepo(pullRequests: PullRequestMeta[]): PullRequestsByRepo[] {
  const repoMap: { [key: string]: PullRequestsByRepo } = {};

  pullRequests.forEach((pr) => {
    const { nameWithOwner } = pr.repository;
    const [repoOwner, repoName] = nameWithOwner.split('/');

    if (!repoMap[nameWithOwner]) {
      repoMap[nameWithOwner] = {
        repoName,
        repoOwner,
        pullRequests: []
      };
    }

    repoMap[nameWithOwner].pullRequests.push(pr);
  });

  const repoArray: PullRequestsByRepo[] = Object.values(repoMap);

  repoArray.sort((a, b) => b.pullRequests.length - a.pullRequests.length);

  return repoArray;
}

export async function getPullRequestsByRepo(
  params: GithubUserName & GithubGraphQLQuery
): Promise<PullRequestsByRepo[]> {
  const pullRequests = await getMergedPullRequests(params);
  return groupAndSortPullRequestsByRepo(pullRequests);
}
