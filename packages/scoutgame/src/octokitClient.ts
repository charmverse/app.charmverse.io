import { Octokit } from '@octokit/rest';

export const octokit: Octokit = new Octokit({
  auth: process.env.SCOUTGAME_GITHUB_ACCOUNT_TOKEN
});
