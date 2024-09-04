import { GITHUB_APP_NAME, GITHUB_CLIENT_ID } from './constants';

export function getGithubAppCallbackUrl({ redirect }: { redirect: string }) {
  return `https://github.com/apps/${GITHUB_APP_NAME}/installations/new?state=${encodeURIComponent(
    JSON.stringify({
      redirect
    })
  )}`;
}

export function getGithubOAuthCallbackUrl({ redirect, state }: { redirect: string; state?: string }) {
  return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirect
  )}&state=${encodeURIComponent(state || '')}`;
}
