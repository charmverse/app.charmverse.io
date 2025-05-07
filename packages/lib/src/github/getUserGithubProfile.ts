import { GET } from '@packages/adapters/http';
import { githubAccessToken } from '@packages/config/constants';

import type { GithubUserName } from './getMergedPullRequests';

export type GitHubUserProfile = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  hireable: boolean;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};

export async function getUserGitHubProfile({ githubUsername }: GithubUserName): Promise<GitHubUserProfile> {
  const url = `https://api.github.com/users/${githubUsername}`;

  const data = await GET<GitHubUserProfile>(url, undefined, {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`
    }
  });

  return data;
}
