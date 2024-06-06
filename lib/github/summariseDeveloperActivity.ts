import { log } from '@charmverse/core/log';

import { InvalidStateError } from 'lib/middleware';
import { prettyPrint } from 'lib/utils/strings';

import type { GithubGraphQLQuery, GithubUserName } from './getMergedPullRequests';
import { getPullRequestsByRepo } from './getPullRequestsByRepo';
import { getUserGitHubProfile, type GitHubUserProfile } from './getUserGithubProfile';
import { summarisePullRequest, type PullRequestSummaryWithFilePatches } from './summarisePullRequest';

// Default to 6 months ago
function getDefaultFromDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export type LitePullRequestSummary = Pick<
  PullRequestSummaryWithFilePatches,
  'additions' | 'deletions' | 'summary' | 'prTitle'
>;

export type DeveloperActivity = {
  profile: GitHubUserProfile;
  mostActiveRepo: string;
  activity: LitePullRequestSummary[];
};

export async function summariseDeveloperActivity({
  githubUsername,
  fromDate = getDefaultFromDate(),
  limit = 5
}: GithubUserName & GithubGraphQLQuery): Promise<DeveloperActivity> {
  const profile = await getUserGitHubProfile({ githubUsername });

  // Loads 100 pull requests, then groups and sorts them by repository so we have a more accurate assessment of the most active repo
  const pullRequests = await getPullRequestsByRepo({ githubUsername, fromDate, limit: 100 });

  const mostActiveRepo = pullRequests[0];

  // Apply business logic for additional filtering and only pull necessary prs
  const filteredPullRequests = mostActiveRepo.pullRequests.filter((pr) => pr.additions + pr.deletions > 10);

  if (filteredPullRequests.length === 0) {
    throw new InvalidStateError('No pull requests for the given criteria');
  }

  const summaries: PullRequestSummaryWithFilePatches[] = [];

  for (let i = 0; i < filteredPullRequests.length; i++) {
    const pr = filteredPullRequests[i];
    log.info(`Summarising PR (${i + 1}/${filteredPullRequests.length}) for ${githubUsername}`);

    try {
      const summary = await summarisePullRequest({
        githubUsername,
        prNumber: pr.number,
        prTitle: pr.title,
        repoName: mostActiveRepo.repoName,
        repoOwner: mostActiveRepo.repoOwner,
        status: 'merged'
      });

      summaries.push(summary);
    } catch (err) {
      log.error(
        `Failed to summarise PR ${mostActiveRepo.repoOwner}/${mostActiveRepo.repoName}/${pr.number} for ${githubUsername}`,
        { error: err }
      );
    }

    if (summaries.length >= limit) {
      break;
    }
  }

  const liteSummaries: LitePullRequestSummary[] = summaries.map((summary) => ({
    additions: summary.additions,
    deletions: summary.deletions,
    summary: summary.summary,
    prTitle: summary.prTitle
  }));

  return {
    profile,
    activity: liteSummaries,
    mostActiveRepo: `${mostActiveRepo.repoOwner}/${mostActiveRepo.repoName}`
  };
}
