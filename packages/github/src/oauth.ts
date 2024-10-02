export function getGithubAppCallbackUrl({ appName, redirect }: { appName: string; redirect: string }) {
  return `https://github.com/apps/${appName}/installations/new?state=${encodeURIComponent(
    JSON.stringify({
      redirect
    })
  )}`;
}

export function getGithubOAuthCallbackUrl({
  clientId,
  redirect,
  state
}: {
  clientId: string;
  redirect: string;
  state?: string;
}) {
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirect
  )}&state=${encodeURIComponent(state || '')}`;
}
