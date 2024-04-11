import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from 'octokit';

import { decodedGithubPrivateKey, githubAppId } from 'config/constants';

export function createOctokitApp(installationId: string) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: githubAppId,
      privateKey: decodedGithubPrivateKey,
      installationId
    }
  });
}
