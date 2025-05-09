export const githubWebUrl = `https://github.com`;

export function isGithubRepositoryUrl(url: string): boolean {
  if (!url?.startsWith(githubWebUrl)) {
    return false;
  }

  const splitted = url.replace(`${githubWebUrl}/`, '').split('/');

  if (splitted.length !== 2) {
    return false;
  }

  const githubCharacterRegex = /^[\w.-]+$/;

  // Expecting a repository URL to have owner and repo
  if (!splitted[0].match(githubCharacterRegex) || !splitted[1].match(githubCharacterRegex)) {
    return false;
  }

  return true;
}
