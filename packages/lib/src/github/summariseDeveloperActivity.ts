import { log } from '@charmverse/core/log';
import { InvalidStateError } from '@packages/nextjs/errors';

import type { GithubGraphQLQuery, GithubUserName } from './getMergedPullRequests';
import type { PullRequestMeta } from './getPullRequestMeta';
import { getPullRequestsByRepo } from './getPullRequestsByRepo';
import { getUserGitHubProfile, type GitHubUserProfile } from './getUserGithubProfile';
import { summarisePullRequest, type PullRequestSummaryWithFilePatches } from './summarisePullRequest';

// Default to 12 months ago
function getDefaultFromDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export type LitePullRequestSummary = Pick<
  PullRequestSummaryWithFilePatches,
  'additions' | 'deletions' | 'summary' | 'prTitle'
>;

export type DeveloperActivity = {
  profile: GitHubUserProfile;
  activity: LitePullRequestSummary[];
};

export async function summariseDeveloperActivity({
  githubUsername,
  fromDate = getDefaultFromDate(),
  limit = 5
}: GithubUserName & GithubGraphQLQuery): Promise<DeveloperActivity> {
  const profile = await getUserGitHubProfile({ githubUsername });

  // Loads 100 pull requests, then groups and sorts them by repository so we have a more accurate assessment of the most active repo
  const pullRequestsByRepo = await getPullRequestsByRepo({ githubUsername, fromDate, limit: 100 });

  const filteredPullRequests: PullRequestMeta[] = [];

  let currentCount = 0;

  // Iterate through each repository
  for (const repo of pullRequestsByRepo) {
    // Apply business logic for filtering pull requests
    const repoFilteredPRs = repo.pullRequests.filter((pr) => pr.additions + pr.deletions > 5);

    // Add pull requests to the final list until the limit is reached
    for (const pr of repoFilteredPRs) {
      if (currentCount >= limit) {
        break;
      }
      filteredPullRequests.push(pr);
      currentCount += 1;
    }

    if (currentCount >= limit) {
      break;
    }
  }

  if (filteredPullRequests.length === 0) {
    throw new InvalidStateError('No pull requests for the given criteria');
  }

  const summaries: PullRequestSummaryWithFilePatches[] = [];

  for (let i = 0; i < filteredPullRequests.length; i++) {
    const pr = filteredPullRequests[i];
    log.info(`Summarising PR (${i + 1}/${filteredPullRequests.length}) for ${githubUsername}`);

    const [repoOwner, repoName] = pr.repository.nameWithOwner.split('/');

    try {
      const summary = await summarisePullRequest({
        prNumber: pr.number,
        repoName,
        repoOwner
      });

      summaries.push(summary);
    } catch (err) {
      log.error(`Failed to summarise PR ${repoOwner}/${repoName}/${pr.number} for ${githubUsername}`, {
        error: err
      });
    }

    if (summaries.length >= limit) {
      break;
    }
  }

  const liteSummaries: LitePullRequestSummary[] = summaries.map((summary) => ({
    additions: summary.additions,
    deletions: summary.deletions,
    summary: summary.summary,
    prTitle: summary.prTitle,
    repo: `${summary.repoOwner}/${summary.repoName}`
  }));

  return {
    profile,
    activity: liteSummaries
  };
}
