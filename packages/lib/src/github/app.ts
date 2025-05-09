import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { githubAppId, githubPrivateKey } from '@packages/config/constants';

export function createOctokitApp(installationId: string) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: githubAppId,
      privateKey: githubPrivateKey,
      installationId
    }
  });
}
